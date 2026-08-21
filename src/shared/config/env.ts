/**
 * Environment configuration validator & getter.
 * Enforces strict separation: ONLY EXPO_PUBLIC_ / NEXT_PUBLIC_ variables
 * are allowed in client bundles.
 */

export const Config = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  CLOUDINARY_CLOUD_NAME: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_UPLOAD_PRESET: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
  IS_DEV: typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production',
} as const;

// Runtime Security Audit: Prevent secret key leaks in frontend bundle
if (typeof window !== 'undefined' || typeof process !== 'undefined') {
  Object.keys(Config).forEach((key) => {
    const val = (Config as any)[key];
    if (typeof val === 'string' && (val.startsWith('sk-') || val.includes('SECRET') || val.includes('PRIVATE_KEY'))) {
      console.error(`[SECURITY WARNING] Potential secret key detected in public config field "${key}"!`);
    }
  });
}
