const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'src', 'app');

const replacements = [
    // index.tsx & explore.tsx & wardrobe.tsx (depth 3)
    { from: "'../../../components/navigation/SwipeTabWrapper'", to: "'@/shared/ui/navigation/SwipeTabWrapper'" },
    { from: "'../../../components/ui/AppGradientBackground'", to: "'@/shared/ui/AppGradientBackground'" },
    { from: "'../../../components/ui/HomeHeader'", to: "'@/shared/ui/HomeHeader'" },
    { from: "'../../../components/ui/OutfitAnalyzingCard'", to: "'@/features/ai-styling/ui/OutfitAnalyzingCard'" },
    { from: "'../../../components/ui/RecentlyUploadedCard'", to: "'@/features/wardrobe/ui/RecentlyUploadedCard'" },
    { from: "'../../../components/ui/WardrobeRingSummaryCard'", to: "'@/features/wardrobe/ui/WardrobeRingSummaryCard'" },
    { from: "'../../../components/ui/WeeklyCalendarStrip'", to: "'@/shared/ui/WeeklyCalendarStrip'" },
    { from: "'../../../hooks/useScrollToHideTabBar'", to: "'@/shared/ui/useScrollToHideTabBar'" },
    { from: "'../../../components/ui/AddClothesCTA'", to: "'@/shared/ui/AddClothesCTA'" }, // Wait AddClothesCTA moved? I didn't map it. Let's map it to shared/ui
    { from: "'../../../components/ui/LookAIBanner'", to: "'@/shared/ui/LookAIBanner'" },
    { from: "'../../../components/ui/StreakPopup'", to: "'@/shared/ui/StreakPopup'" },
    { from: "'../../../components/ui/UpcomingEvents'", to: "'@/shared/ui/UpcomingEvents'" },
    { from: "'../../../components/ui/WardrobeFilterTabs'", to: "'@/features/wardrobe/ui/WardrobeFilterTabs'" },
    { from: "'../../../components/ui/WardrobeMessageBar'", to: "'@/features/wardrobe/ui/WardrobeMessageBar'" },
    { from: "'../../../components/ui/WeatherOutfitCard'", to: "'@/features/ai-styling/ui/WeatherOutfitCard'" },
    { from: "'../../../components/ui/GradientButton'", to: "'@/shared/ui/GradientButton'" },
    { from: "'../../../store/onboarding-store'", to: "'@/features/onboarding/model/onboarding-store'" },
    { from: "'../../../components/ui/WardrobeActivityTracker'", to: "'@/features/wardrobe/ui/WardrobeActivityTracker'" },
    { from: "'../../../store/saved-store'", to: "'@/features/wardrobe/model/saved-store'" },
    { from: "'../../../hooks/useCommunityPosts'", to: "'@/features/social/api/useCommunityPosts'" },
    { from: "'../../../hooks/useGroupPosts'", to: "'@/features/social/api/useGroupPosts'" },
    { from: "'../../../hooks/useGroups'", to: "'@/features/social/api/useGroups'" },
    { from: "'../../../components/ui/TrendFeed'", to: "'@/features/social/ui/TrendFeed'" },
    { from: "'../../../components/navigation/MaterialTopTabs'", to: "'@/shared/ui/navigation/MaterialTopTabs'" },
    { from: "'../../../components/navigation/CustomTabBar'", to: "'@/shared/ui/navigation/CustomTabBar'" },
    
    // depth 2
    { from: "'../../components/ui/AppGradientBackground'", to: "'@/shared/ui/AppGradientBackground'" },
    { from: "'../../components/ui/UpcomingEvents'", to: "'@/shared/ui/UpcomingEvents'" },
    { from: "'../../lib/cloudinary'", to: "'@/shared/api-client/cloudinary'" },
    { from: "'../../store/onboarding-store'", to: "'@/features/onboarding/model/onboarding-store'" },
    { from: "'../../components/navigation/SwipeableTabs'", to: "'@/shared/ui/navigation/SwipeableTabs'" },
    
    // depth 1
    { from: "'../components/ui/ErrorStateView'", to: "'@/shared/ui/ErrorStateView'" },
];

function replaceInFile(filePath) {
    if (fs.statSync(filePath).isDirectory()) {
        fs.readdirSync(filePath).forEach(f => replaceInFile(path.join(filePath, f)));
        return;
    }
    
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        
        for (const repl of replacements) {
            // Check both double and single quotes
            const doubleFrom = repl.from.replace(/'/g, '"');
            const doubleTo = repl.to.replace(/'/g, '"');
            
            if (content.includes(repl.from)) {
                content = content.split(repl.from).join(repl.to);
                changed = true;
            }
            if (content.includes(doubleFrom)) {
                content = content.split(doubleFrom).join(doubleTo);
                changed = true;
            }
        }
        
        if (changed) {
            fs.writeFileSync(filePath, content);
            console.log('Fixed imports in', filePath);
        }
    }
}

replaceInFile(root);
console.log('Finished updating app imports.');
