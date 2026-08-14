# Look AI — Contributing Guide

> **Status:** Active · **Last updated:** 2026-08-14

Thank you for your interest in contributing to Look AI! This guide covers everything you need to get started, from setting up your dev environment to submitting pull requests.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Architecture Guidelines](#architecture-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)
- [Release Process](#release-process)

---

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and follow our [Code of Conduct](https://github.com/som2077/Look-AI/blob/main/CODE_OF_CONDUCT.md) (if one exists) or the standard open-source etiquette:

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **Expo CLI**: `npm i -g expo-cli`
- **Git** with SSH or HTTPS configured
- A **Clerk account** (free tier is fine) for auth keys
- A **Supabase project** (free tier is fine) for the backend
- **Android Studio** or **Xcode** if you want to run on device/emulator

### Fork & Clone

```bash
# 1. Fork the repo on GitHub (click the "Fork" button)

# 2. Clone your fork locally
git clone https://github.com/YOUR_USERNAME/Look-AI.git
cd Look-AI

# 3. Add upstream remote
git remote add upstream https://github.com/som2077/Look-AI.git

# 4. Create a feature branch
git checkout -b feat/your-feature-name
```

### Install Dependencies

```bash
npm install
```

### Environment Setup

Create a `.env` file in the project root. Copy the template from the [main README](https://github.com/som2077/Look-AI/blob/main/README.md#2-configure-environment) and fill in your keys:

```env
# Auth
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# Gemini
GOOGLE_GEMINI_API_KEY=xxx
EXPO_PUBLIC_GEMINI_API_KEY=xxx

# ... etc (see main README for full list)
```

> **Never commit `.env` files.** They are gitignored by default.

### Start the Dev Server

```bash
npx expo start --clear
```

- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan the QR code with Expo Go on your device

---

## Development Workflow

### Branch Naming

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/add-search-filter` |
| `fix/` | Bug fix | `fix/wardrobe-crash-on-delete` |
| `refactor/` | Code improvement (no behavior change) | `refactor/extract-wardrobe-hooks` |
| `docs/` | Documentation only | `docs/update-readme-setup` |
| `chore/` | Maintenance tasks | `chore/upgrade-expo-sdk` |
| `test/` | Adding or fixing tests | `test/add-wardrobe-unit-tests` |

### Commit Messages

We follow the **Conventional Commits** format:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Examples:**

```
feat(wardrobe): add category filter chips to wardrobe tab
fix(streaks): correct streak counter off-by-one on month boundary
refactor(shared): extract supabase client to separate module
docs(readme): update environment variable documentation
chore(deps): upgrade expo to SDK 54
test(wardrobe): add unit tests for masonry layout logic
```

### Pre-Commit Checklist

Before pushing, make sure:

- [ ] Code compiles without errors (`npx expo start` loads cleanly)
- [ ] Lint passes (`npm run lint`)
- [ ] Tests pass (`npm run test`) — if you changed logic
- [ ] No console errors in dev mode
- [ ] New features have basic documentation (in-code comments or docs/)
- [ ] `.env` is not accidentally committed

### Syncing with Upstream

```bash
# Fetch upstream changes
git fetch upstream

# Rebase your feature branch onto latest main
git rebase upstream/main

# Resolve any conflicts, then force-push
git push origin feat/your-feature-name --force-with-lease
```

> Prefer rebase over merge for feature branches to keep history clean.

---

## Coding Standards

### TypeScript

- **Strict mode** is enabled. No `any` types unless absolutely necessary (and then, justify in a comment).
- Prefer `interface` over `type` for object shapes (better extensibility).
- Use explicit return types on exported functions.
- No `// @ts-ignore` without a comment explaining why.

### React Native / Expo

- **Functional components only** — no class components.
- **Hooks** for state and side effects. Custom hooks should be prefixed with `use`.
- **Expo Router** file-based navigation. Route groups use `()` syntax.
- **Zustand** for global state. Prefer it over React Context for frequently-updated state.
- **NativeWind / Tailwind** for styling. No inline `StyleSheet.create` unless dynamic values are needed.

### File Organization

Follow the **Screaming Architecture** pattern:

```
features/<feature-name>/
├── api/          # Server queries, mutations, edge function calls
├── components/   # Feature-specific UI components
├── hooks/        # Custom hooks for this feature
├── types.ts      # Feature-specific types
└── index.ts      # Public exports (optional)
```

**Never** import from one feature into another feature directly. Cross-feature communication goes through:
- `shared/` utilities
- Zustand stores
- Supabase queries (which are inherently cross-feature)

### Component Design

- Small, focused components (< 150 lines ideally)
- Props interfaces defined with `interface`
- Custom components go in `components/`, screen components go in `app/`
- Reusable UI components go in `shared/ui/`
- Avoid deeply nested component trees (> 5 levels)

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | `PascalCase` | `WardrobeScreen`, `MasonryGrid` |
| Hooks | `camelCase`, `use` prefix | `useWardrobeItems`, `useStreakSync` |
| Utilities | `camelCase` | `formatDate`, `buildQuery` |
| Types/Interfaces | `PascalCase` | `WardrobeItem`, `UserProfile` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_WEARDROBE_ITEMS` |
| Files | Match primary export | `wardrobe.tsx` exports `WardrobeScreen` |

---

## Architecture Guidelines

### Feature Isolation

The `features/` directory is the core of the app. Each feature should be as self-contained as possible:

- A feature's `api/` should only talk to Supabase/edge functions — not to other features' APIs
- A feature's components should only import from `shared/ui/` or its own `components/`
- Cross-feature state should go through Zustand stores in `shared/`

### Supabase Queries

- Use the cached fetch layer (`shared/supabase/use-supabase-query.ts`) for all queries
- Don't bypass the cache with raw `supabase.from().select()` unless you have a specific reason
- All queries should be paginated or limited — no unbounded `select()` calls

### Edge Functions

- Edge functions live in `supabase/functions/`
- Always use the rate-limited client — don't call edge functions directly from the app without rate-limit awareness
- Test edge functions locally with `supabase functions serve <name>`

### Realtime

- Use the singleton Realtime manager (`shared/realtime/manager.ts`) — don't create channels ad-hoc
- Only subscribe to channels you actually need. Unsubscribe on unmount.

### Images

- All user-uploaded images go through Cloudinary (signed uploads)
- Background removal uses the `remove-bg` edge function
- Never store raw image blobs in the database — always store URLs

---

## Testing

### Running Tests

```bash
npm run test          # Run all tests
npm run test -- --watch   # Watch mode during development
```

### Test Structure

Tests live alongside the code they test:

```
features/wardrobe/
├── api/
│   ├── wardrobeApi.ts
│   └── wardrobeApi.test.ts    # Unit tests for API layer
├── components/
│   ├── WardrobeGrid.tsx
│   └── WardrobeGrid.test.tsx  # Component tests
└── hooks/
    ├── useWardrobeItems.ts
    └── useWardrobeItems.test.ts
```

### What to Test

- **API layer**: Query shapes, error handling, edge cases
- **Custom hooks**: State transitions, side effects
- **Components**: Rendering with different props, user interactions (using React Native Testing Library)
- **Utility functions**: Pure function outputs for various inputs

### What NOT to Test

- Expo Router navigation (integration-level, hard to unit test)
- Supabase client setup (tested implicitly via API tests)
- Third-party library behavior (Clerk, RevenueCat, etc.)

### Writing Tests

Use **Jest** + **React Native Testing Library**:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { useEffect } from 'react';
import { useWardrobeItems } from './useWardrobeItems';

// Test a hook via a test component
function TestComponent(props: { items: string[] }) {
  const items = useWardrobeItems(props.items);
  return <View testID="items">{items.map(i => <Text key={i}>{i}</Text>)}</View>;
}

it('renders wardrobe items', () => {
  const { getByTestId } = render(<TestComponent items={['shirt', 'pants']} />);
  expect(getByTestId('items').children.length).toBe(2);
});
```

---

## Documentation

### When to Update Docs

- **New feature**: Add a section to `docs/ARCHITECTURE.md` or a dedicated doc
- **API change**: Update `DATABASE.md` if DB schema changes, or edge function docs if function behavior changes
- **Setup change**: Update the main `README.md` "Getting Started" section
- **Breaking change**: Document in the commit message AND in the relevant doc file

### Doc File Locations

| Topic | File |
|-------|------|
| High-level overview | `README.md` (main) |
| Database schema | `DATABASE.md` |
| Architecture deep-dive | `docs/ARCHITECTURE.md` |
| Contributing guide | `docs/CONTRIBUTING.md` (this file) |
| Deployment / prod setup | `docs/DEPLOYMENT.md` |
| Troubleshooting / FAQ | `docs/TROUBLESHOOTING.md` |
| Edge functions reference | `docs/API_EDGE_FUNCTIONS.md` |
| Load testing | `scripts/loadtest/README.md` |

### Documentation Style

- Use clear, concise language
- Include code examples for setup and usage
- Keep diagrams simple (Mermaid for ERDs, ASCII for flow charts)
- Update the "Last updated" header when making changes
- Cross-reference related docs (e.g., "See DATABASE.md §3 for table details")

---

## Submitting Changes

### Pull Request Process

1. **Push your branch** to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```

2. **Open a PR** on GitHub:
   - Target branch: `main` (or the appropriate release branch)
   - Title: Follow conventional commit format (`feat(scope): description`)
   - Description: Explain what, why, and any testing done

3. **PR Description Template**:
   ```markdown
   ## Summary
   Brief description of the change.

   ## Motivation
   Why is this change needed? What problem does it solve?

   ## Testing
   - [ ] Locally tested on Android
   - [ ] Locally tested on iOS
   - [ ] Unit tests added/updated
   - [ ] No console errors in dev mode

   ## Screenshots (if UI change)
   Before | After
   ------ | ------

   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Lint passes (`npm run lint`)
   - [ ] Tests pass (`npm run test`)
   - [ ] Documentation updated (if applicable)
   - [ ] No `.env` or secret files committed
   ```

4. **Request review**: Tag relevant reviewers or leave it for the maintainers.

5. **Address feedback**: Make requested changes, push to the same branch. The PR updates automatically.

6. **Merge**: Once approved, a maintainer will merge. Squash-merge is the default.

### PR Size Guidelines

- **Small PRs** (< 200 lines): Fine to submit as-is
- **Medium PRs** (200-500 lines): Consider splitting if they touch multiple concerns
- **Large PRs** (> 500 lines): Strongly recommend splitting into smaller, reviewable PRs

---

## Review Process

### For Contributors (What to Expect)

1. A maintainer will review your PR within a few days (weekends may be slower)
2. Review feedback will be posted as comments on the PR
3. You'll need to address the feedback and push updates
4. Once approved, the PR will be merged

### For Reviewers (What to Look For)

- **Correctness**: Does the code do what it claims? Edge cases handled?
- **Style**: Follows coding standards? Consistent with surrounding code?
- **Architecture**: Respects feature isolation? No inappropriate cross-feature imports?
- **Performance**: No N+1 queries, no unbounded reads, reasonable state updates?
- **Security**: RLS considered? Inputs validated? Secrets not leaked?
- **Testing**: New logic covered by tests? Existing tests still pass?
- **Documentation**: Docs updated if needed? Code commented where non-obvious?

### Review Commands (GitHub)

Use GitHub's review tools:
- **Approve**: Ready to merge
- **Comment**: Feedback but no block
- **Request changes**: Must address before merge

---

## Release Process

Releases are managed by the project maintainers. The general flow:

1. **Version bump**: Update `version` in `package.json` (semantic versioning)
2. **Changelog**: Update `CHANGELOG.md` with notable changes
3. **Testing**: Full test suite + manual smoke test on device
4. **Tag & release**: Create a Git tag and GitHub release
5. **Publish**:
   - **Expo**: `npx expo export` (for EAS build)
   - **App stores**: Submit via EAS Submit or manually

> Contributors don't need to worry about the release process — just focus on getting your PR merged into `main`.

---

## Getting Help

- **Issues**: Check existing issues or create a new one for bugs/feature requests
- **Discussions**: Use GitHub Discussions for general questions
- **PR comments**: Ask questions directly on your PR

---

## Credits

Contributors are added to the project's contributor list. Thank you for making Look AI better!
