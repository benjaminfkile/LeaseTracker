# LeaseTracker — Copilot Coding Agent Instructions

## Project Overview
React Native mobile app (iOS + Android) for tracking car lease mileage. Built with TypeScript.
Targets the App Store and Google Play. Consumes the `lease-tracker-api` backend.

## Tech Stack
- **Framework:** React Native 0.84 with TypeScript
- **Navigation:** React Navigation (native stack + bottom tabs)
- **State:** Zustand (auth/app state) + TanStack Query (server/async state)
- **HTTP:** Axios client in `src/api/client.ts` with automatic Cognito token refresh
- **Auth:** `amazon-cognito-identity-js` — tokens stored in AsyncStorage
- **Forms:** React Hook Form + Zod resolvers
- **IAP:** `react-native-iap`
- **Ads:** `react-native-google-mobile-ads` (AdMob) — free tier only
- **Push notifications:** `@react-native-firebase/messaging` + `@notifee/react-native`
- **Charts:** `react-native-gifted-charts`
- **Env vars:** `react-native-config` (`.env`, `.env.development`, `.env.production`)
- **Tests:** Jest + React Native Testing Library (`npm test`)
- **Build verification:** `npx tsc --noEmit` (TypeScript check — no native build required for most tasks)

## Branch & PR Rules — CRITICAL
- **Always base your branch off `dev`.** Never branch from `main`.
- **All PRs must target `dev`.** Never open a PR targeting `main`.
- `main` is production-only and is never a valid PR target under any circumstances.

## Standing Rules
- All existing unit and component tests must continue to pass.
- New tests must be added for all new and modified code, matching the style and conventions of existing test files, achieving 90–95%+ coverage.
- Run `npx tsc --noEmit` after completing changes to confirm zero TypeScript errors.
- Run `npm test` after completing changes to confirm all tests pass.
- Never hardcode API URLs, ad unit IDs, Cognito pool IDs, or Firebase config — always use `react-native-config` env vars.
- Premium features must be gated with the `PremiumGate` component — never bypass the gate.
- Ads (`BannerAdView`) must only render when `isPremium === false` — always guard with this condition.
- All API calls must go through `src/api/client.ts` — never use `fetch` directly.
- Components in `src/components/` must be generic and reusable — no screen-specific business logic.
- Infrastructure tasks (Apple Developer portal, App Store Connect, Google Play Console, Firebase, AdMob console, or signing) cannot be executed by code — describe the exact manual steps required.
- Tasks labeled `manual` are human-only. Do not attempt to implement them; instead post a comment listing the exact manual steps the human must perform.

## File Conventions
- Screens: `src/screens/<FeatureName>/<ScreenName>.tsx`
- Components: `src/components/<ComponentName>.tsx`
- Stores: `src/stores/<name>Store.ts`
- Hooks: `src/hooks/use<Name>.ts`
- API: `src/api/<resource>.ts` (calls through `src/api/client.ts`)
- Types: `src/types/` or inline in feature files
- Always read `App.tsx` and the relevant navigation file before adding screens.

## Mock API Strategy
If the corresponding API phase is not yet deployed, build screens against mocked API
responses using inline mock data or `jest.mock`. Do not block screen implementation
waiting for real endpoints. The real API call shape must match the mock so it can be
swapped in later with no screen-level changes.

## PR Description Format
The PR body **must** include `Closes #<issue_number>` (e.g. `Closes #42`) so the issue is automatically closed when the PR is merged.

## Commit Message Format
A single plain sentence describing what was done. No `feat:` or conventional commit prefixes.
