# Look AI — Folder Structure & Error-Free App Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Clean up the project folder structure (move patch scripts, organize root), fix all TypeScript/import errors, make the app build and run without errors, and set up a proper test foundation.

**Architecture:** Organize root-level scripts into `scripts/`, verify/fix all import paths, ensure TypeScript strict mode passes, and add minimal tests where needed.

**Tech Stack:** Expo/TS/React Native, tsc for typecheck, Jest for tests

---

## Phase 1: Folder Structure Cleanup

### Task 1: Move patch scripts from root to `scripts/`

**Objective:** Root directory clean karna — JS patch files root mein nahi honi chahiye

**Files:**
- Move: `fix_ai_scan_final.js` → `scripts/fix_ai_scan_final.js`
- Move: `fix_ai_scan_mock.js` → `scripts/fix_ai_scan_mock.js`
- Move: `fix_ai_scan_types.js` → `scripts/fix_ai_scan_types.js`
- Move: `patch_ai_scan.js` → `scripts/patch_ai_scan.js`

**Step 1: Create scripts directory if not exists**

```bash
mkdir -p scripts
```

**Step 2: Move each file**

```bash
mv fix_ai_scan_final.js scripts/
mv fix_ai_scan_mock.js scripts/
mv fix_ai_scan_types.js scripts/
mv patch_ai_scan.js scripts/
```

**Step 3: Verify root is clean**

```bash
ls -la | grep -E "\.js$"
# Expected: package.json, package-lock.json만 나와야 함 (앱 JS 파일 제외)
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: move patch scripts from root to scripts/"
```

---

### Task 2: Check and fix `patches/` directory (if it exists)

**Objective:** `patches/` folder exist karti hai ya nahi — check and report

**Files:** N/A

**Step 1: Check if patches directory exists**

```bash
ls -la patches/ 2>/dev/null || echo "No patches/ directory"
```

**Step 2: If exists, inspect contents**

- Agar `patches/` mein valid patch files hain-to report karna
- Agar empty/stale hain-to clean karna

**Step 3: Commit (if changes)**

```bash
git add -A
git commit -m "chore: clean up patches directory"
```

---

## Phase 2: TypeScript / Import Error Fix

### Task 3: Run typecheck and capture ALL errors

**Objective:** Purane errors ka list banana — pehle sab dekhna hai

**Files:** N/A

**Step 1: Run tsc**

```bash
npm run typecheck 2>&1 | tee /tmp/typecheck-output.txt
```

**Step 2: Parse errors**

Expected output: list of TS errors with file:line:col

**Step 3: Save error list for next tasks**

```bash
cat /tmp/typecheck-output.txt
```

---

### Task 4: Fix missing import errors (stores in scan-result.tsx)

**Objective:** `scan-result.tsx` mein missing stores: `useScanHistoryStore`, `useUserWardrobeStore`

**Files:**
- Modify: `src/app/(root)/add-clothes/scan-result.tsx`
- Read: `src/features/scanning/model/scan-history-store.ts` (if exists)
- Read: `src/features/wardrobe/model/user-wardrobe-store.ts` (if exists)

**Step 1: Check if stores exist**

```bash
# Check scan-history-store
ls src/features/scanning/model/scan-history-store.ts 2>/dev/null && echo "EXISTS" || echo "MISSING"
# Check user-wardrobe-store
ls src/features/wardrobe/model/user-wardrobe-store.ts 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

**Step 2: A) Agar missing hain — create them**

**Create: `src/features/scanning/model/scan-history-store.ts`**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { namespacedAsyncStorage } from '@/shared/storage/namespacedStorage';

export interface ScanHistoryItem {
  id: string;
  type: string;
  thumbnail: string;
  date: string;
  result: Record<string, unknown>;
  isFavorite: boolean;
}

interface ScanHistoryState {
  scans: ScanHistoryItem[];
  addScan: (item: Omit<ScanHistoryItem, 'id'>) => void;
  removeScan: (id: string) => void;
  toggleFavorite: (id: string) => void;
  clearHistory: () => void;
}

let _idCounter = 0;
export const useScanHistoryStore = create<ScanHistoryState>()(
  persist(
    (set) => ({
      scans: [],
      addScan: (item) => {
        const id = `scan_${Date.now()}_${++_idCounter}`;
        set((state) => ({
          scans: [...state.scans, { ...item, id }],
        }));
      },
      removeScan: (id) => {
        set((state) => ({
          scans: state.scans.filter((s) => s.id !== id),
        }));
      },
      toggleFavorite: (id) => {
        set((state) => ({
          scans: state.scans.map((s) =>
            s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
          ),
        }));
      },
      clearHistory: () => set({ scans: [] }),
    }),
    {
      name: 'scan-history-store',
      storage: createJSONStorage(() => namespacedAsyncStorage),
      partialize: (state) => ({ scans: state.scans }),
    }
  )
);
```

**Create: `src/features/wardrobe/model/user-wardrobe-store.ts`**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { namespacedAsyncStorage } from '@/shared/storage/namespacedStorage';

export interface WardrobeItem {
  id: string;
  userId?: string;
  customName: string;
  brand: string;
  category: string;
  subCategory: string;
  primaryColor: string;
  secondaryColors: string[];
  pattern: string;
  fabricGuess: string;
  fit: string;
  sleeveType?: string;
  neckType?: string;
  season: string[];
  occasion: string[];
  formalityScore: number;
  versatilityTags: string[];
  careInstructions: string;
  notes: string;
  colorHex: string;
  imageUrl: string;
  originalImageUrl: string;
  confidence: number;
  source: string;
  isFavorite: boolean;
  wearCount: number;
}

interface UserWardrobeState {
  items: WardrobeItem[];
  addItem: (item: Omit<WardrobeItem, 'id'>) => void;
  removeItem: (id: string) => void;
  hasItem: (category: string, color: string) => boolean;
  getItemById: (id: string) => WardrobeItem | undefined;
  clearWardrobe: () => void;
}

let _wardrobeIdCounter = 0;
export const useUserWardrobeStore = create<UserWardrobeState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const id = `wardrobe_${Date.now()}_${++_wardrobeIdCounter}`;
        set((state) => ({
          items: [...state.items, { ...item, id }],
        }));
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },
      hasItem: (category: string, color: string) => {
        return get().items.some(
          (i) => i.category === category && i.primaryColor === color
        );
      },
      getItemById: (id: string) => {
        return get().items.find((i) => i.id === id);
      },
      clearWardrobe: () => set({ items: [] }),
    }),
    {
      name: 'user-wardrobe-store',
      storage: createJSONStorage(() => namespacedAsyncStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

**Step 2: B) Agar exist karte hain — check import paths**

Agar files exist karti hain, to sirf import path fix karna:
- `src/app/(root)/add-clothes/scan-result.tsx` line 3-4 mein import check karo
- Agar wrong path hai-to correct karo

**Step 3: Verify typecheck passes for these imports**

```bash
npm run typecheck 2>&1 | grep -E "scan-result|scan-history|wardrobe"
# Expected: no errors
```

**Step 4: Commit**

```bash
git add src/app/\(root\)/add-clothes/scan-result.tsx src/features/scanning/model/scan-history-store.ts src/features/wardrobe/model/user-wardrobe-store.ts
git commit -m "fix: add missing scan-history and user-wardrobe stores"
```

---

### Task 5: Fix all remaining TypeScript errors

**Objective:** `npm run typecheck` zero errors pe pass ho

**Files:** Errors list ke hisaab se — har file alag

**Step 1: Re-run typecheck and capture errors**

```bash
npm run typecheck 2>&1
```

**Step 2: Fix each error category**

Error categories ke liye alag-alag fixes:

**a) Missing type declarations (nativewind-env.d.ts, expo-env.d.ts)**
```typescript
// NativeWind types
declare module 'nativewind' {
  // existing types
}
```

**b) Any type errors**
- `clothScan.test.ts` mein `any` types hain — proper types dein
- `scan-result.tsx` mein `resultJson?: string` ko type-safe banao

**c) Unused imports / variables**
- Har file mein unused import hatao

**d) Return type mismatches**
- `analyzeMultiClothingWardrobe` ka return type check karo (ai-scan.ts line 475)

**Step 3: Run typecheck again**

```bash
npm run typecheck
# Expected: SUCCESS (no errors)
```

**Step 4: Commit per fix**

Har major fix ke baad commit:
```bash
git add <files>
git commit -m "fix(ts): resolve <error description>"
```

---

## Phase 3: Test Infrastructure

### Task 6: Add unit test for scan-history-store

**Objective:** Scan history store ka test — CRUD operations verify karna

**Files:**
- Create: `src/features/scanning/model/scan-history-store.test.ts`
- Modify: `package.json` (if test config needed)

**Step 1: Write test**

```typescript
import { useScanHistoryStore } from './scan-history-store';

describe('ScanHistoryStore', () => {
  beforeEach(() => {
    useScanHistoryStore.getState().clearHistory();
  });

  it('initializes with empty scans', () => {
    const state = useScanHistoryStore.getState();
    expect(state.scans).toEqual([]);
  });

  it('adds a scan and assigns unique id', () => {
    useScanHistoryStore.getState().addScan({
      type: 'cloth',
      thumbnail: 'file://test.jpg',
      date: new Date().toISOString(),
      result: { name: 'Test Item' },
      isFavorite: false,
    });

    const state = useScanHistoryStore.getState();
    expect(state.scans).toHaveLength(1);
    expect(state.scans[0].id).toMatch(/^scan_\d+/);
    expect(state.scans[0].type).toBe('cloth');
  });

  it('removes a scan by id', () => {
    useScanHistoryStore.getState().addScan({
      type: 'cloth',
      thumbnail: 'file://test.jpg',
      date: new Date().toISOString(),
      result: {},
      isFavorite: false,
    });

    const id = useScanHistoryStore.getState().scans[0].id;
    useScanHistoryStore.getState().removeScan(id);
    expect(useScanHistoryStore.getState().scans).toHaveLength(0);
  });

  it('toggles favorite status', () => {
    useScanHistoryStore.getState().addScan({
      type: 'cloth',
      thumbnail: 'file://test.jpg',
      date: new Date().toISOString(),
      result: {},
      isFavorite: false,
    });

    const id = useScanHistoryStore.getState().scans[0].id;
    useScanHistoryStore.getState().toggleFavorite(id);
    expect(useScanHistoryStore.getState().scans[0].isFavorite).toBe(true);

    useScanHistoryStore.getState().toggleFavorite(id);
    expect(useScanHistoryStore.getState().scans[0].isFavorite).toBe(false);
  });
});
```

**Step 2: Run test**

```bash
npx jest src/features/scanning/model/scan-history-store.test.ts --verbose
# Expected: 4 passed
```

**Step 3: Commit**

```bash
git add src/features/scanning/model/scan-history-store.test.ts
git commit -m "test: add scan-history-store unit tests"
```

---

### Task 7: Add unit test for user-wardrobe-store

**Objective:** Wardrobe store ka test — add, remove, hasItem

**Files:**
- Create: `src/features/wardrobe/model/user-wardrobe-store.test.ts`

**Step 1: Write test**

```typescript
import { useUserWardrobeStore, WardrobeItem } from './user-wardrobe-store';

describe('UserWardrobeStore', () => {
  beforeEach(() => {
    useUserWardrobeStore.getState().clearWardrobe();
  });

  it('initializes with empty items', () => {
    expect(useUserWardrobeStore.getState().items).toEqual([]);
  });

  it('adds an item and assigns unique id', () => {
    const item: Omit<WardrobeItem, 'id'> = {
      userId: 'user_1',
      customName: 'Blue Jeans',
      brand: 'Levi\'s',
      category: 'Bottoms',
      subCategory: 'Jeans',
      primaryColor: 'Blue',
      secondaryColors: [],
      pattern: 'Solid',
      fabricGuess: 'Denim',
      fit: 'Slim',
      season: ['All Season'],
      occasion: ['Casual'],
      formalityScore: 5,
      versatilityTags: [],
      careInstructions: 'Machine wash',
      notes: '',
      colorHex: '#0000FF',
      imageUrl: 'https://example.com/jeans.jpg',
      originalImageUrl: 'https://example.com/jeans.jpg',
      confidence: 0.95,
      source: 'camera',
      isFavorite: false,
      wearCount: 0,
    };

    useUserWardrobeStore.getState().addItem(item);
    const state = useUserWardrobeStore.getState();

    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toMatch(/^wardrobe_\d+/);
    expect(state.items[0].customName).toBe('Blue Jeans');
  });

  it('hasItem returns true for matching category+color', () => {
    useUserWardrobeStore.getState().addItem({
      userId: 'user_1',
      customName: 'Red Shirt',
      brand: '',
      category: 'Top',
      subCategory: 'T-shirt',
      primaryColor: 'Red',
      secondaryColors: [],
      pattern: 'Solid',
      fabricGuess: 'Cotton',
      fit: 'Regular',
      season: ['All Season'],
      occasion: ['Casual'],
      formalityScore: 5,
      versatilityTags: [],
      careInstructions: '',
      notes: '',
      colorHex: '#FF0000',
      imageUrl: '',
      originalImageUrl: '',
      confidence: 0.9,
      source: 'manual',
      isFavorite: false,
      wearCount: 0,
    });

    expect(useUserWardrobeStore.getState().hasItem('Top', 'Red')).toBe(true);
    expect(useUserWardrobeStore.getState().hasItem('Top', 'Blue')).toBe(false);
  });

  it('removes an item by id', () => {
    useUserWardrobeStore.getState().addItem({
      userId: 'user_1',
      customName: 'Test Item',
      brand: '',
      category: 'Top',
      subCategory: 'Shirt',
      primaryColor: 'White',
      secondaryColors: [],
      pattern: 'Solid',
      fabricGuess: 'Cotton',
      fit: 'Regular',
      season: ['All Season'],
      occasion: ['Casual'],
      formalityScore: 5,
      versatilityTags: [],
      careInstructions: '',
      notes: '',
      colorHex: '#FFFFFF',
      imageUrl: '',
      originalImageUrl: '',
      confidence: 0.9,
      source: 'manual',
      isFavorite: false,
      wearCount: 0,
    });

    const id = useUserWardrobeStore.getState().items[0].id;
    useUserWardrobeStore.getState().removeItem(id);
    expect(useUserWardrobeStore.getState().items).toHaveLength(0);
  });
});
```

**Step 2: Run test**

```bash
npx jest src/features/wardrobe/model/user-wardrobe-store.test.ts --verbose
# Expected: 4 passed
```

**Step 3: Commit**

```bash
git add src/features/wardrobe/model/user-wardrobe-store.test.ts
git commit -m "test: add user-wardrobe-store unit tests"
```

---

## Phase 4: Final Verification

### Task 8: Full typecheck + test run

**Objective:** Sab kuch clean — typecheck zero errors, sab tests pass

**Files:** N/A

**Step 1: Run typecheck**

```bash
npm run typecheck
# Expected: SUCCESS - no errors
```

**Step 2: Run all tests**

```bash
npm test
# Expected: all tests pass
```

**Step 3: Lint check**

```bash
npm run lint
# Expected: no errors (or acceptable warnings only)
```

**Step 4: Final commit if needed**

```bash
git add -A
git commit -m "chore: final cleanup — typecheck clean, tests passing"
```

---

## Risks & Open Questions

| Risk | Mitigation |
|------|-----------|
| `analyzeMultiClothingWardrobe` incomplete (ai-scan.ts ends at line 500+) | Check full file, fix return type |
| Missing `namespacedStorage` import in new stores | Already imported in outfit-analysis-store — reuse same import pattern |
| `usePremiumLimits` hook missing (scan-result.tsx line 94) | Check if file exists; if not, create or fix import |
| `useStreakSync` / `useStreakStore` missing | Same — check imports |
| Auth-related hooks (`useAuth`) may need Clerk setup | Already in root layout — should work |

## Test Targets Summary

| Test File | What it covers |
|-----------|---------------|
| `src/features/scanning/model/scan-history-store.test.ts` | Scan history CRUD |
| `src/features/wardrobe/model/user-wardrobe-store.test.ts` | Wardrobe CRUD + hasItem |
| `src/features/wardrobe/api/clothScan.test.ts` | Existing — verify it still passes |
| `src/__tests__/router-render.test.tsx` | Existing — verify it still passes |
