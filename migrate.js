const fs = require('fs');
const path = require('path');

const root = path.join(__dirname);
const srcDir = path.join(root, 'src');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeMove(from, to) {
    if (fs.existsSync(from)) {
        ensureDir(path.dirname(to));
        fs.cpSync(from, to, { recursive: true });
        fs.rmSync(from, { recursive: true, force: true });
    }
}

// 1. Create target directories
const dirs = [
    'src/app',
    'src/features/wardrobe/ui',
    'src/features/wardrobe/model',
    'src/features/wardrobe/api',
    'src/features/ai-styling/ui',
    'src/features/ai-styling/model',
    'src/features/scanning/ui',
    'src/features/scanning/model',
    'src/features/scanning/api',
    'src/features/social/ui',
    'src/features/social/model',
    'src/features/social/api',
    'src/features/shopping/api',
    'src/features/weather/model',
    'src/features/billing/api',
    'src/features/billing/model',
    'src/features/billing/config',
    'src/features/billing/ui/payment',
    'src/features/onboarding/ui/onboarding',
    'src/features/onboarding/model',
    'src/shared/ui/navigation',
    'src/shared/api-client/supabase-backend',
    'src/shared/config',
    'src/shared/model',
    'src/shared/lib',
];

dirs.forEach(d => ensureDir(path.join(root, d)));

// 2. Move app/ to src/app/
if (fs.existsSync(path.join(root, 'app'))) {
    const appFiles = fs.readdirSync(path.join(root, 'app'));
    appFiles.forEach(f => {
        safeMove(path.join(root, 'app', f), path.join(root, 'src/app', f));
    });
    fs.rmSync(path.join(root, 'app'), { recursive: true, force: true });
}

// 3. Move files based on mapping
const moveMap = [
    // WARDROBE
    { from: 'components/ui/WardrobeFilterTabs.tsx', to: 'src/features/wardrobe/ui/WardrobeFilterTabs.tsx' },
    { from: 'components/ui/WardrobeRingSummaryCard.tsx', to: 'src/features/wardrobe/ui/WardrobeRingSummaryCard.tsx' },
    { from: 'components/ui/WardrobeMessageBar.tsx', to: 'src/features/wardrobe/ui/WardrobeMessageBar.tsx' },
    { from: 'components/ui/RecentlyUploadedCard.tsx', to: 'src/features/wardrobe/ui/RecentlyUploadedCard.tsx' },
    { from: 'components/ui/WardrobeActivityTracker.tsx', to: 'src/features/wardrobe/ui/WardrobeActivityTracker.tsx' },
    { from: 'store/user-wardrobe-store.ts', to: 'src/features/wardrobe/model/user-wardrobe-store.ts' },
    { from: 'store/saved-store.ts', to: 'src/features/wardrobe/model/saved-store.ts' },
    { from: 'hooks/useWardrobeSummary.ts', to: 'src/features/wardrobe/api/useWardrobeSummary.ts' },
    
    // AI-STYLING
    { from: 'components/ui/AIPickOfTheDayCard.tsx', to: 'src/features/ai-styling/ui/AIPickOfTheDayCard.tsx' },
    { from: 'components/ui/WeatherOutfitCard.tsx', to: 'src/features/ai-styling/ui/WeatherOutfitCard.tsx' },
    { from: 'components/ui/OutfitAnalyzingCard.tsx', to: 'src/features/ai-styling/ui/OutfitAnalyzingCard.tsx' },
    { from: 'store/outfit-analysis-store.ts', to: 'src/features/ai-styling/model/outfit-analysis-store.ts' },
    
    // SCANNING
    { from: 'components/ui/ScanningOverlay.tsx', to: 'src/features/scanning/ui/ScanningOverlay.tsx' },
    { from: 'components/ui/ScanResultSheet.tsx', to: 'src/features/scanning/ui/ScanResultSheet.tsx' },
    { from: 'store/scan-history-store.ts', to: 'src/features/scanning/model/scan-history-store.ts' },
    { from: 'lib/gemini-scan.ts', to: 'src/features/scanning/api/gemini-scan.ts' },
    { from: 'lib/gemini-vision.ts', to: 'src/features/scanning/api/gemini-vision.ts' },
    
    // SOCIAL
    { from: 'components/ui/TrendFeed.tsx', to: 'src/features/social/ui/TrendFeed.tsx' },
    { from: 'store/social-store.ts', to: 'src/features/social/model/social-store.ts' },
    { from: 'hooks/useCommunityPosts.ts', to: 'src/features/social/api/useCommunityPosts.ts' },
    { from: 'hooks/useGroupPosts.ts', to: 'src/features/social/api/useGroupPosts.ts' },
    { from: 'hooks/useGroups.ts', to: 'src/features/social/api/useGroups.ts' },
    
    // SHOPPING
    { from: 'hooks/useAffiliateProducts.ts', to: 'src/features/shopping/api/useAffiliateProducts.ts' },
    { from: 'hooks/useSheinProducts.ts', to: 'src/features/shopping/api/useSheinProducts.ts' },
    
    // WEATHER
    { from: 'store/weather-store.ts', to: 'src/features/weather/model/weather-store.ts' },
    
    // ONBOARDING
    { from: 'store/onboarding-store.ts', to: 'src/features/onboarding/model/onboarding-store.ts' },
    
    // SHARED
    { from: 'components/ui/GradientButton.tsx', to: 'src/shared/ui/GradientButton.tsx' },
    { from: 'components/ui/ErrorStateView.tsx', to: 'src/shared/ui/ErrorStateView.tsx' },
    { from: 'components/ui/AppGradientBackground.tsx', to: 'src/shared/ui/AppGradientBackground.tsx' },
    { from: 'components/ui/HomeHeader.tsx', to: 'src/shared/ui/HomeHeader.tsx' },
    { from: 'components/ui/LookAIBanner.tsx', to: 'src/shared/ui/LookAIBanner.tsx' },
    { from: 'components/ui/StreakPopup.tsx', to: 'src/shared/ui/StreakPopup.tsx' },
    { from: 'components/ui/UpcomingEvents.tsx', to: 'src/shared/ui/UpcomingEvents.tsx' },
    { from: 'components/ui/WeeklyCalendarStrip.tsx', to: 'src/shared/ui/WeeklyCalendarStrip.tsx' },
    { from: 'hooks/useScrollToHideTabBar.ts', to: 'src/shared/ui/useScrollToHideTabBar.ts' },
    
    { from: 'hooks/useSupabase.ts', to: 'src/shared/api-client/useSupabase.ts' },
    { from: 'hooks/useSupabaseQuery.ts', to: 'src/shared/api-client/useSupabaseQuery.ts' },
    { from: 'lib/supabase.ts', to: 'src/shared/api-client/supabase.ts' },
    { from: 'lib/cloudinary.ts', to: 'src/shared/api-client/cloudinary.ts' },
    
    { from: 'store/ui-store.ts', to: 'src/shared/model/ui-store.ts' },
    { from: 'lib/ratelimit.ts', to: 'src/shared/lib/ratelimit.ts' },
    { from: 'lib/entitlement.ts', to: 'src/features/billing/api/entitlement.ts' },
    
    { from: 'services/notificationService.ts', to: 'src/shared/lib/notificationService.ts' },
];

moveMap.forEach(m => {
    safeMove(path.join(root, m.from), path.join(root, m.to));
});

// Move whole directories
const moveDirs = [
    { from: 'components/navigation', to: 'src/shared/ui/navigation' },
    { from: 'components/onboarding', to: 'src/features/onboarding/ui/onboarding' },
    { from: 'components/payment', to: 'src/features/billing/ui/payment' },
    { from: 'supabase', to: 'src/shared/api-client/supabase-backend' },
    { from: 'constants', to: 'src/shared/config/constants' },
];

moveDirs.forEach(m => {
    safeMove(path.join(root, m.from), path.join(root, m.to));
});

// Move contents of billing
if (fs.existsSync(path.join(root, 'billing'))) {
    const billingFiles = fs.readdirSync(path.join(root, 'billing'));
    billingFiles.forEach(f => {
        if (f.includes('Service') || f === 'hooks.ts' || f === 'index.ts') {
            safeMove(path.join(root, 'billing', f), path.join(root, 'src/features/billing/api', f));
        } else if (f === 'store.ts' || f === 'types.ts') {
            safeMove(path.join(root, 'billing', f), path.join(root, 'src/features/billing/model', f));
        } else if (f === 'constants.ts') {
            safeMove(path.join(root, 'billing', f), path.join(root, 'src/features/billing/config', f));
        } else {
            safeMove(path.join(root, 'billing', f), path.join(root, 'src/features/billing', f));
        }
    });
    fs.rmSync(path.join(root, 'billing'), { recursive: true, force: true });
}

console.log('Finished moving files.');

// Update tsconfig.json
const tsconfigPath = path.join(root, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
    let tsconfig = fs.readFileSync(tsconfigPath, 'utf8');
    tsconfig = tsconfig.replace('"@/*": [\n        "./*"\n      ]', '"@/*": [\n        "./src/*"\n      ]');
    fs.writeFileSync(tsconfigPath, tsconfig);
    console.log('Updated tsconfig.json paths');
}

// Read all files in src/ and recursively replace all string instances of "@/" with old paths to new paths.
const importReplacements = moveMap.map(m => ({
    from: '@/' + m.from.replace(/\.tsx?$/, ''),
    to: '@/' + m.to.replace(/^src\//, '').replace(/\.tsx?$/, '')
}));

// Also handle the moved directories
moveDirs.forEach(m => {
    importReplacements.push({
        from: '@/' + m.from,
        to: '@/' + m.to.replace(/^src\//, '')
    });
});

// Also handle billing contents
importReplacements.push({ from: '@/billing/hooks', to: '@/features/billing/api/hooks' });
importReplacements.push({ from: '@/billing/BillingService', to: '@/features/billing/api/BillingService' });
importReplacements.push({ from: '@/billing/store', to: '@/features/billing/model/store' });
importReplacements.push({ from: '@/billing/types', to: '@/features/billing/model/types' });
importReplacements.push({ from: '@/billing/constants', to: '@/features/billing/config/constants' });
importReplacements.push({ from: '@/billing/index', to: '@/features/billing/api/index' });
importReplacements.push({ from: '@/billing', to: '@/features/billing/api/index' });

function replaceInFile(filePath) {
    if (fs.statSync(filePath).isDirectory()) {
        fs.readdirSync(filePath).forEach(f => replaceInFile(path.join(filePath, f)));
        return;
    }
    
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        
        for (const repl of importReplacements) {
            if (content.includes(repl.from)) {
                content = content.split(repl.from).join(repl.to);
                changed = true;
            }
        }
        
        if (changed) {
            fs.writeFileSync(filePath, content);
        }
    }
}

replaceInFile(srcDir);
console.log('Finished updating imports.');

// Remove empty directories
['components/ui', 'components', 'store', 'hooks', 'lib', 'services', 'constants'].forEach(d => {
    if (fs.existsSync(path.join(root, d))) {
        try { fs.rmSync(path.join(root, d), { recursive: true, force: true }); } catch(e) {}
    }
});
