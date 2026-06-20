# Codebase Bug Report

This report summarizes the issues found in the codebase by running the project's linter and type-checker.

## Overview

- **TypeScript Compiler (`tsc`)**: Passed with 0 errors.
- **ESLint (`eslint`)**: Failed with 4 errors and 57 warnings across multiple files.

## High Priority Issues (Errors)

The following linting errors must be addressed as they indicate potential runtime or rendering issues.

### 1. Unescaped Entities in React Components

React expects certain characters like `'`, `"`, `>`, and `}` to be escaped in JSX text strings to avoid parsing errors or unexpected behavior.

**File:** `app/(root)/(tabs)/profile.tsx`

- **Line 658:** `` `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;` ``

**File:** `app/(root)/log-outfit/info.tsx`

- **Line 172:** `` `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;` ``

_Recommendation:_ Replace the unescaped apostrophes (`'`) in the JSX text with the HTML entity `&apos;` or `&rsquo;`, or wrap the text in curly braces with quotes `{"'"}`.

## Medium Priority Issues (Warnings)

### 1. Missing Dependencies in React Hooks

Several `useEffect` and `useCallback` hooks have missing dependencies. This can lead to stale closures, bugs, or unexpected behavior when component state or props change.

- `app/(root)/calendar.tsx` (Line 146): `useEffect` missing `fetchDeviceEvents`
- `app/(root)/onboarding/gender.tsx` (Line 36): `useCallback` missing `posthog`
- `app/(root)/onboarding/style-preference.tsx` (Line 81): `useCallback` missing `posthog`
- `components/ui/AIPickOfTheDayCard.tsx` (Line 64): `useEffect` missing `progress`
- `components/ui/WeatherOutfitCard.tsx` (Line 45): `useEffect` missing `progress`
- `components/ui/WeatherOutfitCard.tsx` (Line 86): `useEffect` missing `circumference` and `progress`
- `components/ui/WeatherOutfitCard.tsx` (Line 223): `useEffect` missing `fetchWeather`

_Recommendation:_ Carefully review these hooks and add the missing dependencies to the dependency arrays, or use `eslint-disable-next-line` if the omission is intentional and well-understood.

### 2. Unused Variables and Imports

A large number of variables, components, and hooks are defined but never used. This bloats the codebase and makes it harder to read and maintain.

_Key areas with unused code:_

- `app/(root)/(tabs)/explore.tsx` (Unused imports: Settings, MoreHorizontal, X, etc.)
- `app/(root)/(tabs)/wardrobe.tsx` (Unused categories, icons, and components)
- `components/ui/TrendFeed.tsx` (Multiple unused icons, components, and maps)

_Recommendation:_ Remove these unused definitions to clean up the codebase.

### 3. Duplicate Imports

- `components/navigation/CustomTabBar.tsx` imports from `react` multiple times.

_Recommendation:_ Consolidate the imports from `react` into a single import statement.

## Conclusion

The application is type-safe according to TypeScript, but the ESLint errors and warnings suggest a need for code cleanup. Fixing the unescaped entities and the React hook dependency warnings should be the immediate priority to prevent potential bugs.
