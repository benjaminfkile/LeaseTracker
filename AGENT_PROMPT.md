You are a coding agent working on the `LeaseTracker` project — a React Native mobile app targeting iOS and Android, built with TypeScript. Follow these rules without exception for the entire session.

## Project Context
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
- **Build verification:** `npx tsc --noEmit` (TypeScript check, no native build required for most tasks)
- **Task file:** `TASKS.md` in the project root

---

## Standing Rules
- Do NOT mark any task as complete until I explicitly say "approved" or "mark it complete".
- Never execute any git commands under any circumstances.
- When all work is verified and done, generate a suggested commit message as a single plain sentence. No "feat:" or any other prefix — just a plain sentence.
- All existing unit and component tests must continue to pass.
- New tests must be added for all new and modified code, matching the style and conventions of existing test files, achieving 90–95%+ coverage.
- Run `npx tsc --noEmit` after completing all changes to confirm zero TypeScript errors.
- Run `npm test` after completing all changes to confirm all tests pass.
- Never hardcode API URLs, ad unit IDs, Cognito pool IDs, or Firebase config — always use `react-native-config` env vars.
- Premium features must be gated with the `PremiumGate` component — never bypass the gate.
- Ads (`BannerAdView`) must only render when `isPremium === false` — always guard with this condition.
- All API calls must go through `src/api/client.ts` — never use `fetch` directly.
- Components in `src/components/` must be generic and reusable — no screen-specific business logic.
- Infrastructure tasks (Apple Developer, App Store Connect, Google Play Console, Firebase, AdMob, or environment setup) cannot be executed by code — describe the exact manual steps required and mark them as requiring human action.

---

## Workflow

### Step 1 — Read the task document

Read `TASKS.md` before doing anything else. This is the single source of truth for all tasks and their status.

---

### Step 2 — Identify the next task

Scan tasks in order. A task is complete if and only if its checkbox is checked: `- [x]`. Stop at the first task whose checkbox is unchecked: `- [ ]` and state clearly:
- The phase number, task number, and task name
- The full acceptance criteria for that task
- Whether it is an infrastructure task requiring manual human steps

---

### Step 3 — Read relevant code

Before planning, read all source files directly relevant to the task. Always read at minimum:
- `App.tsx` (root setup)
- `src/navigation/` files relevant to the task
- Any existing screen, component, hook, or store being extended

Do not skip this step.

---

### Step 4 — Present your plan

Describe every file you will create or modify and exactly what will change. Include:
- New components, screens, hooks, or store slices
- Props interfaces and TypeScript types
- Navigation param list changes (if adding new screens)
- All new test cases (describe block, test names, and what each asserts)
- Any `npx pod-install` or native config changes required (flag these clearly)
- For infrastructure tasks: the exact manual steps the human must perform (numbered checklist)

Do not write any code yet. Wait for approval.

---

### Step 5 — Implement (only after approval)

Only after I explicitly approve the plan:
- For code tasks: implement all changes.
- For infrastructure tasks: output the exact steps as a numbered checklist and wait for confirmation they are complete before proceeding.
- If the task requires native changes (`Info.plist`, `AndroidManifest.xml`, `build.gradle`, Podfile), make those changes and note that `npx pod-install` must be run manually.

---

### Step 6 — Verify

Run `npx tsc --noEmit` — confirm zero TypeScript errors.
Run `npm test` — confirm all tests pass.
Report the results explicitly.

---

### Step 7 — Suggest a commit message

Generate a single plain sentence describing what was done.

---

### Step 8 — Wait

Tell me the work is ready for review. Do not proceed to the next task.

---

### Step 9 — If approved

If I say "approved":
1. Mark the completed task in `TASKS.md` by changing `- [ ]` to `- [x]`.
2. Then STOP — do not proceed to the next task.
