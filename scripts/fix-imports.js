const fs = require('fs');
const path = require('path');

const replacements = [
    {
        file: 'src/features/billing/api/BillingService.ts',
        rules: [
            { from: 'from "./constants"', to: 'from "../config/constants"' },
            { from: 'from "./types"', to: 'from "../model/types"' }
        ]
    },
    {
        file: 'src/features/billing/api/entitlement.ts',
        rules: [
            { from: 'from "./supabase"', to: 'from "@/shared/api-client/supabase"' }
        ]
    },
    {
        file: 'src/features/billing/api/hooks.ts',
        rules: [
            { from: 'from "./store"', to: 'from "../model/store"' },
            { from: 'from "./constants"', to: 'from "../config/constants"' },
            { from: 'from "./types"', to: 'from "../model/types"' }
        ]
    },
    {
        file: 'src/features/billing/api/index.ts',
        rules: [
            { from: 'from "./types"', to: 'from "../model/types"' },
            { from: 'from "./constants"', to: 'from "../config/constants"' },
            { from: 'from "./store"', to: 'from "../model/store"' }
        ]
    },
    {
        file: 'src/features/billing/config/constants.ts',
        rules: [
            { from: 'from "./types"', to: 'from "../model/types"' }
        ]
    },
    {
        file: 'src/features/billing/model/store.ts',
        rules: [
            { from: 'from "./BillingService"', to: 'from "../api/BillingService"' },
            { from: 'from "./constants"', to: 'from "../config/constants"' }
        ]
    },
    {
        file: 'src/features/social/api/useCommunityPosts.ts',
        rules: [
            { from: 'from "../lib/cloudinary"', to: 'from "@/shared/api-client/cloudinary"' },
            { from: 'from "./useSupabase"', to: 'from "@/shared/api-client/useSupabase"' }
        ]
    },
    {
        file: 'src/features/social/api/useGroupPosts.ts',
        rules: [
            { from: 'from "./useSupabase"', to: 'from "@/shared/api-client/useSupabase"' }
        ]
    },
    {
        file: 'src/features/social/api/useGroups.ts',
        rules: [
            { from: 'from "./useSupabase"', to: 'from "@/shared/api-client/useSupabase"' }
        ]
    },
    {
        file: 'src/features/wardrobe/api/useWardrobeSummary.ts',
        rules: [
            { from: 'from "./useSupabaseQuery"', to: 'from "@/shared/api-client/useSupabaseQuery"' }
        ]
    },
    {
        file: 'src/shared/api-client/useSupabaseQuery.ts',
        rules: [
            { from: 'from "../components/ui/ErrorStateView"', to: 'from "../ui/ErrorStateView"' }
        ]
    },
    {
        file: 'src/shared/ui/navigation/CustomTabBar.tsx',
        rules: [
            { from: 'from "../../store/ui-store"', to: 'from "../../model/ui-store"' }
        ]
    },
    {
        file: 'src/shared/ui/useScrollToHideTabBar.ts',
        rules: [
            { from: 'from "../store/ui-store"', to: 'from "../model/ui-store"' }
        ]
    }
];

replacements.forEach(item => {
    const fullPath = path.join(__dirname, item.file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let changed = false;
        item.rules.forEach(r => {
            if (content.includes(r.from)) {
                content = content.replace(r.from, r.to);
                changed = true;
            }
        });
        if (changed) {
            fs.writeFileSync(fullPath, content);
            console.log('Fixed imports in', item.file);
        }
    }
});
