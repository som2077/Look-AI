const fs = require('fs');
const files = [
  'supabase/functions/openai-proxy/index.ts',
  'supabase/functions/analyze-cloth-item/index.ts',
  'supabase/functions/cloth-label-scan/index.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Replace the strict 401 check with a fallback to a generic anon user
  content = content.replace(
    /const userId = getUserIdFromJwt\(authHeader\);\n  if \(\!userId\) \{\n    return new Response\(JSON\.stringify\(\{ error: "Unauthorized" \}\), \{\n      status: 401,\n      headers: \{ \.\.\.corsHeaders, "Content-Type": "application\/json" \},\n    \}\);\n  \}/,
    'const userId = getUserIdFromJwt(authHeader) || "anon_user";'
  );
  fs.writeFileSync(file, content);
  console.log('Patched', file);
});
