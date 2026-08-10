// Look AI — PostgREST load test (k6)
//
// Simulates the real app's request mix against the Supabase REST surface:
//   reads:   community feed (deep select), own likes, notifications, wardrobe
//   writes:  like, reaction, comment, mark-all-read, username RPC
//
// Auth: the app's RLS reads `auth.jwt() ->> 'sub'` (Clerk text user id). k6
// mints per-VU HS256 JWTs with role=authenticated and sub=loadtest-user-<VU>
// using the project JWT secret, so each virtual user exercises RLS exactly
// like a real signed-in client — no anon/service-role shortcuts on the surface.
//
// Run (against a DEV BRANCH, never prod — see README):
//   k6 run \
//     -e SUPABASE_URL=https://<project-ref>.supabase.co \
//     -e SUPABASE_JWT_SECRET=<project-jwt-secret> \
//     -e MAX_VUS=200 \
//     scripts/loadtest/k6-load-test.js
//
// Install k6: https://k6.io/docs/getting-started/installation/

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

const BASE = __ENV.SUPABASE_URL || 'https://<project-ref>.supabase.co';
const JWT_SECRET = __ENV.SUPABASE_JWT_SECRET || '';
const MAX_VUS = Number(__ENV.MAX_VUS || 100);

// ─── JWT minting (HS256, same algorithm Supabase uses) ─────────────────────────

function base64url(obj) {
  const json = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return encoding
    .b64encode(json)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function mintJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const signingInput = `${base64url(header)}.${base64url(payload)}`;
  const sig = crypto
    .hmac('sha256', JWT_SECRET, signingInput, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${signingInput}.${sig}`;
}

function authTokenFor(role, sub) {
  const now = Math.floor(Date.now() / 1000);
  return mintJwt({
    role,
    sub,
    iss: 'supabase',
    ref: BASE.replace(/^https?:\/\//, '').split('.')[0],
    exp: now + 3600,
    iat: now,
  });
}

// ─── Options ───────────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    // Weighted mix of the app's real PostgREST traffic, ramping to MAX_VUS.
    app_mix: {
      executor: 'ramping-vus',
      exec: 'mix',
      startVUs: 0,
      stages: [
        { duration: '60s', target: MAX_VUS },
        { duration: '60s', target: MAX_VUS },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'], // p95 latency budget
  },
};

// Seed data shared by all VUs: a handful of posts to like/comment/react on.
const POSTS = new SharedArray('seed-posts', () => {
  const ids = [];
  for (let i = 0; i < 10; i++) ids.push(`loadtest-post-${i}`);
  return ids;
});

// ─── Setup: create the users + posts the test needs (via service_role) ────────

export function setup() {
  if (!JWT_SECRET) {
    throw new Error(
      'SUPABASE_JWT_SECRET is required. Get it from Supabase dashboard ' +
        '(Settings → API → JWT secret). Never test against production.',
    );
  }

  const serviceToken = authTokenFor('service_role', 'loadtest-setup');
  const headers = {
    Authorization: `Bearer ${serviceToken}`,
    apikey: serviceToken,
    'Content-Type': 'application/json',
  };

  // user_profiles rows so FK-constrained writes (wardrobe_items, posts, ...) succeed.
  const profiles = [];
  for (let i = 1; i <= MAX_VUS; i++) {
    profiles.push({
      user_id: `loadtest-user-${i}`,
      username: `loadtest${i}`,
      nickname: `Load Test ${i}`,
    });
  }
  const upRes = http.post(
    `${BASE}/rest/v1/user_profiles?on_conflict=user_id`,
    JSON.stringify(profiles),
    { headers },
  );

  // Seed posts for writes to target (fixed owner user).
  const posts = [];
  for (let i = 0; i < POSTS.length; i++) {
    posts.push({
      id: POSTS[i],
      user_id: 'loadtest-user-1',
      image_url: `https://example.com/seed-${i}.jpg`,
      caption: `load test seed post ${i}`,
    });
  }
  const postRes = http.post(
    `${BASE}/rest/v1/community_posts?on_conflict=id`,
    JSON.stringify(posts),
    { headers },
  );

  check(upRes, { 'setup: user_profiles seeded': (r) => r.status === 201 });
  check(postRes, { 'setup: posts seeded': (r) => r.status === 201 });

  return { postIds: POSTS };
}

// ─── The app-mix iteration ─────────────────────────────────────────────────────

export function mix(data) {
  const vu = __VU || 1;
  const userId = `loadtest-user-${vu}`;
  const token = authTokenFor('authenticated', userId);
  const auth = {
    Authorization: `Bearer ${token}`,
    apikey: token,
    'Content-Type': 'application/json',
  };

  const postId = data.postIds[Math.floor(Math.random() * data.postIds.length)];

  // Weighted pick ~ real app behavior (reads dominate).
  const roll = Math.random() * 100;
  let res;

  if (roll < 50) {
    // Community feed — the app's biggest read (deep select, newest 50).
    res = http.get(
      `${BASE}/rest/v1/community_posts?select=*,user_profiles(nickname,username,user_id,avatar_url),post_reactions(user_id,reaction_type)&order=created_at.desc&limit=50`,
      { headers: auth },
    );
    check(res, { 'feed: 200': (r) => r.status === 200 });
  } else if (roll < 62) {
    // Own likes (drives the like-toggle state on the feed screen).
    res = http.get(
      `${BASE}/rest/v1/post_likes?select=post_id&user_id=eq.${userId}`,
      { headers: auth },
    );
    check(res, { 'own-likes: 200': (r) => r.status === 200 });
  } else if (roll < 77) {
    // Notifications list (nested actor + post joins, newest 50).
    res = http.get(
      `${BASE}/rest/v1/notifications?select=*,actor_profile:user_profiles!actor_id(nickname,username,avatar_url),community_post:community_posts!post_id(image_url,caption)&user_id=eq.${userId}&order=created_at.desc&limit=50`,
      { headers: auth },
    );
    check(res, { 'notifications: 200': (r) => r.status === 200 });
  } else if (roll < 87) {
    // Wardrobe sync (bounded to 500).
    res = http.get(
      `${BASE}/rest/v1/wardrobe_items?select=*&user_id=eq.${userId}&order=created_at.desc&limit=500`,
      { headers: auth },
    );
    check(res, { 'wardrobe: 200': (r) => r.status === 200 });
  } else if (roll < 92) {
    // Like a post.
    res = http.post(
      `${BASE}/rest/v1/post_likes`,
      JSON.stringify({ post_id: postId, user_id: userId }),
      { headers: auth },
    );
    check(res, { 'like: 201': (r) => r.status === 201 });
  } else if (roll < 96) {
    // Add a reaction (fires the SECURITY DEFINER trigger → notifications insert).
    const types = ['👍', '❤️', '😂', '😮', '😢', '😡'];
    res = http.post(
      `${BASE}/rest/v1/post_reactions`,
      JSON.stringify({
        post_id: postId,
        user_id: userId,
        reaction_type: types[Math.floor(Math.random() * types.length)],
      }),
      { headers: auth },
    );
    check(res, { 'reaction: 201': (r) => r.status === 201 });
  } else if (roll < 98) {
    // Comment.
    res = http.post(
      `${BASE}/rest/v1/post_comments`,
      JSON.stringify({ post_id: postId, user_id: userId, content: 'load test comment' }),
      { headers: auth },
    );
    check(res, { 'comment: 201': (r) => r.status === 201 });
  } else if (roll < 99) {
    // Mark all notifications read.
    res = http.patch(
      `${BASE}/rest/v1/notifications?user_id=eq.${userId}&is_read=eq.false`,
      JSON.stringify({ is_read: true }),
      { headers: auth },
    );
    check(res, { 'mark-read: 2xx': (r) => r.status >= 200 && r.status < 300 });
  } else {
    // Username availability RPC (SECURITY DEFINER, authenticated-only now).
    res = http.post(
      `${BASE}/rest/v1/rpc/check_username_available`,
      JSON.stringify({ check_username: `loadtest${vu + MAX_VUS}` }),
      { headers: auth },
    );
    check(res, { 'rpc-username: 200': (r) => r.status === 200 });
  }

  // Human-ish pacing: 10-20 req/s/user ceiling keeps the mix realistic.
  sleep(Math.random() * 0.5 + 0.1);
}
