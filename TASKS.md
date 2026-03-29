# LeaseTracker Mobile App — Task List

## Overview

This document tracks every task required to build the LeaseTracker React Native app
from the current blank template to a shippable product on the Apple App Store
and Google Play Store.

**Tech choices:**
- Navigation: React Navigation (native stack + bottom tabs)
- State: Zustand (local/auth state) + TanStack Query (server state)
- HTTP: Axios with automatic token refresh interceptor
- Auth: `amazon-cognito-identity-js` (lighter than full Amplify)
- Forms: React Hook Form + Zod
- IAP: `react-native-iap`
- Ads: `react-native-google-mobile-ads` (AdMob)
- Push notifications: `@notifee/react-native` + `@react-native-firebase/messaging`
- Charts: `react-native-gifted-charts`
- Dates: `dayjs`

---

## Sequencing Guide

> ⚠️ **Before starting any mobile work:** Complete `lease-tracker-api` **Phases 1–4** first (infrastructure, migrations, validation, auth, user endpoints). The login screen and token hydration require a live Amazon Cognito User Pool and a working `/api/users/me` endpoint.

Mobile phases are designed to be worked **in order**. Most screens can be built against mocked API responses and swapped for real calls once the corresponding API phase is deployed to `dev`.

| Phase | Name | API Dependency | Can Mock Until? |
|-------|------|---------------|------------------|
| **1** | Dependencies & Project Setup | None | — |
| **2** | Project Structure & Design System | None | — |
| **3** | Auth Flow (Cognito) | Cognito pool live + API Phase 4 | ❌ Needs real Cognito |
| **4** | Navigation Structure | None | Yes |
| **5** | API Layer | API Phase 4 types | Yes — mock all calls |
| **6** | Dashboard Screen | API Phase 5 (leases + summary) | Yes |
| **7** | Lease Management Screens | API Phase 5 | Yes |
| **8** | Odometer Reading Screens | API Phase 6 (readings) | Yes |
| **9** | Pace & Analytics Screens | API Phase 12 (analytics) | Yes |
| **10** | Saved Trips Screens | API Phase 7 (trips) | Yes |
| **11** | Push Notifications | API Phase 11 (notifications) | Partial |
| **12** | Subscriptions (IAP) | API Phase 10 (subscriptions) | Sandbox only |
| **13** | Ads (Free Tier) | Mobile Phase 12 complete | Test ad IDs only |
| **14** | Standout & Advanced Features | Varies — see each task | Partial |
| **15** | Settings Screen | Mobile Phases 3, 11, 12 | Yes |
| **16** | App Store Preparation | All phases complete | ❌ Cannot skip |
| **17** | Testing | Run alongside every phase | — |

### Parallel development strategy
- Build **mobile Phases 1–5** while the API finishes Phases 1–4. No real endpoints needed yet.
- Build **mobile Phases 6–8** while the API is working through Phases 5–7. Use mocked responses.
- Replace mocks with real API calls as each API phase is merged to `dev`.
- **Phase 17 (testing)** is not a final step — write tests as each phase is completed.

---

## Phase 1 — Dependencies & Project Setup

- [ ] **1.1 Install React Navigation**
  ```
  npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
  npm install react-native-screens
  npx pod-install
  ```

- [ ] **1.2 Install state management**
  ```
  npm install zustand
  ```

- [ ] **1.3 Install HTTP and server-state libraries**
  ```
  npm install axios @tanstack/react-query
  ```

- [ ] **1.4 Install async storage**
  ```
  npm install @react-native-async-storage/async-storage
  npx pod-install
  ```

- [ ] **1.5 Install Cognito auth library**
  ```
  npm install amazon-cognito-identity-js
  ```

- [ ] **1.6 Install form handling**
  ```
  npm install react-hook-form zod @hookform/resolvers
  ```

- [ ] **1.7 Install date library**
  ```
  npm install dayjs
  ```

- [ ] **1.8 Install Reanimated and Gesture Handler**
  ```
  npm install react-native-reanimated react-native-gesture-handler
  npx pod-install
  ```
  Add `react-native-reanimated/plugin` to `babel.config.js` plugins array.

- [ ] **1.9 Install vector icons**
  ```
  npm install react-native-vector-icons @types/react-native-vector-icons
  npx pod-install
  ```
  Add font resources to `android/app/build.gradle` and `Info.plist`.

- [ ] **1.10 Install charting library**
  ```
  npm install react-native-gifted-charts react-native-svg
  npx pod-install
  ```

- [ ] **1.11 Install In-App Purchases**
  ```
  npm install react-native-iap
  npx pod-install
  ```
  Add required keys to `Info.plist` (StoreKit) and `AndroidManifest.xml` (Billing permission).

- [ ] **1.12 Install Google Mobile Ads (AdMob)**
  ```
  npm install react-native-google-mobile-ads
  npx pod-install
  ```
  Add AdMob App IDs to `Info.plist` and `AndroidManifest.xml`.

- [ ] **1.13 Install push notifications**
  ```
  npm install @react-native-firebase/app @react-native-firebase/messaging @notifee/react-native
  npx pod-install
  ```
  Add `GoogleService-Info.plist` (iOS) and `google-services.json` (Android) from Firebase console.

- [ ] **1.14 Install date picker**
  ```
  npm install @react-native-community/datetimepicker
  npx pod-install
  ```

- [ ] **1.15 Install `react-native-bootsplash` for splash screen**
  ```
  npm install react-native-bootsplash
  npx pod-install
  ```

- [ ] **1.16 Install `react-native-config` for environment variables**
  ```
  npm install react-native-config
  ```
  Create `.env`, `.env.development`, `.env.production` files.
  Add to `.gitignore`.

- [ ] **1.17 Configure TypeScript path aliases**
  Update `tsconfig.json` with `paths`:
  ```json
  "@api/*": ["src/api/*"],
  "@components/*": ["src/components/*"],
  "@screens/*": ["src/screens/*"],
  "@store/*": ["src/store/*"],
  "@hooks/*": ["src/hooks/*"],
  "@utils/*": ["src/utils/*"],
  "@theme/*": ["src/theme/*"],
  "@types/*": ["src/types/*"]
  ```
  Install `babel-plugin-module-resolver` and configure in `babel.config.js`.

---

## Phase 2 — Project Structure & Design System

- [ ] **2.1 Create folder structure under `src/`**
  ```
  src/
    api/          # Axios client + typed endpoint functions
    auth/         # Cognito config and auth service
    components/   # Reusable UI primitives
    hooks/        # Custom React hooks
    navigation/   # Navigator definitions
    screens/      # Screen components (grouped by feature)
      auth/
      home/
      leases/
      trips/
      settings/
    store/        # Zustand stores
    theme/        # Colors, typography, spacing
    types/        # TypeScript interfaces matching API responses
    utils/        # Pure utilities (formatters, calculations)
  ```

- [ ] **2.2 Create theme constants**
  - `src/theme/colors.ts` — brand palette + semantic tokens (background, surface,
    text, primary, error, success, warning) with light and dark variants
  - `src/theme/typography.ts` — font families, size scale, weights
  - `src/theme/spacing.ts` — spacing scale (4, 8, 12, 16, 20, 24, 32, 40, 48)
  - `src/theme/index.ts` — combined export; `useTheme()` hook that respects
    `useColorScheme()`

- [ ] **2.3 Create base `Button` component**
  - Variants: `primary`, `secondary`, `ghost`, `destructive`
  - Props: `title`, `onPress`, `isLoading`, `disabled`, `leftIcon`
  - Shows `ActivityIndicator` when `isLoading`

- [ ] **2.4 Create base `Input` component**
  - Wraps `TextInput` with label, error message, helper text, left/right icons
  - Highlighted border on focus, red border on error

- [ ] **2.5 Create `Card` component**
  - Shadowed container (platform-appropriate shadow / elevation)

- [ ] **2.6 Create `ScreenHeader` component**
  - Title, optional back button, optional right action button

- [ ] **2.7 Create `EmptyState` component**
  - Illustration placeholder, title, subtitle, optional CTA button

- [ ] **2.8 Create `LoadingOverlay` component**
  - Full-screen translucent overlay with centered spinner

- [ ] **2.9 Create `ErrorMessage` component**
  - Inline error display with icon and retry option

- [ ] **2.10 Set up `ErrorBoundary` wrapping the root navigator**

---

## Phase 3 — Auth Flow (Amazon Cognito)

- [ ] **3.1 Create Cognito config — `src/auth/cognitoConfig.ts`**
  ```ts
  export const cognitoConfig = {
    UserPoolId: Config.COGNITO_USER_POOL_ID,
    ClientId: Config.COGNITO_CLIENT_ID,
    Region: Config.AWS_REGION,
  };
  ```

- [ ] **3.2 Create auth service — `src/auth/authService.ts`**
  Wrap `amazon-cognito-identity-js` with typed methods:
  - `signUp(email, password, displayName)` → initiates sign-up, returns unconfirmed user
  - `confirmSignUp(email, code)` → confirms registration
  - `signIn(email, password)` → returns `{ accessToken, idToken, refreshToken }`
  - `signOut()` → clears session and tokens
  - `forgotPassword(email)` → sends reset code
  - `confirmForgotPassword(email, code, newPassword)` → completes reset
  - `refreshSession(refreshToken)` → returns new token set
  - `resendConfirmationCode(email)`
  - `getStoredTokens()` → read from AsyncStorage
  - `storeTokens(tokens)` → write to AsyncStorage
  - `clearTokens()` → remove from AsyncStorage
  - `decodeIdToken(idToken)` → parse JWT claims (no verification needed client-side)

- [ ] **3.3 Create auth Zustand store — `src/store/authStore.ts`**
  State: `user`, `tokens`, `isLoading`, `isAuthenticated`, `error`
  Actions: `login`, `logout`, `register`, `confirmEmail`, `forgotPassword`,
  `confirmReset`, `refreshTokens`, `hydrateFromStorage`
  `hydrateFromStorage` is called on app boot; loads tokens from AsyncStorage,
  silently refreshes if near expiry.

- [ ] **3.4 Build `LoginScreen`**
  - Email + password fields (react-hook-form + Zod)
  - "Sign In" button with loading state
  - "Forgot Password?" → navigates to ForgotPasswordScreen
  - "Create account" → navigates to RegisterScreen
  - Friendly error messages for wrong credentials vs. unconfirmed account

- [ ] **3.5 Build `RegisterScreen`**
  - Name, email, password, confirm password fields
  - Password strength indicator (length, uppercase, number, symbol)
  - On success, navigate to VerifyEmailScreen passing email

- [ ] **3.6 Build `VerifyEmailScreen`**
  - 6-digit code input (auto-advance between digit boxes)
  - "Verify" button
  - "Resend code" link (rate-limited — disable for 60s after send)

- [ ] **3.7 Build `ForgotPasswordScreen`**
  - Step 1: Enter email → `authService.forgotPassword(email)` → show Step 2
  - Step 2: Code + new password + confirm → `authService.confirmForgotPassword()`
  - On success, navigate to Login with success toast

- [ ] **3.8 Create `AuthNavigator` — `src/navigation/AuthNavigator.tsx`**
  Stack: `Login` → `Register` → `VerifyEmail` → `ForgotPassword`

- [ ] **3.9 Implement Axios token-refresh interceptor — `src/api/client.ts`**
  On 401 response:
  1. Call `authService.refreshSession(refreshToken)`
  2. Store new tokens
  3. Retry original request once with new `idToken`
  4. If refresh also fails → call `authStore.logout()` → app redirects to Login

- [ ] **3.10 Implement auth hydration on app startup**
  In `App.tsx`, wrap startup in a `useEffect` that calls `authStore.hydrateFromStorage()`
  and shows a splash screen (via `react-native-bootsplash`) until hydration resolves.

---

## Phase 4 — Navigation Structure

- [ ] **4.1 Create `RootNavigator` — `src/navigation/RootNavigator.tsx`**
  Reads `isAuthenticated` from `authStore`.
  - If `false` → render `AuthNavigator`
  - If `true` → render `AppNavigator`
  - While `isLoading` (hydration) → render splash screen

- [ ] **4.2 Create `AppNavigator` — Bottom Tab Navigator**
  Tabs: **Home** (dashboard icon) | **Leases** (car icon) | **Trips** (map icon)
  | **Settings** (gear icon)
  Show badge on Home tab if any lease is over pace.

- [ ] **4.3 Create `HomeStack`**
  `Dashboard` → `LeaseDetail` → `OdometerLog` → `AddReading` → `PaceDetail`
  → `BuybackAnalysis` _(premium)_

- [ ] **4.4 Create `LeaseStack`**
  `LeaseList` → `AddLease` (wizard) → `EditLease` → `TurnInChecklist`

- [ ] **4.5 Create `TripsStack`**
  `TripList` → `AddTrip` → `EditTrip`

- [ ] **4.6 Create `SettingsStack`**
  `Settings` → `Account` → `Subscription` → `AlertSettings` → `About`

- [ ] **4.7 Configure deep linking**
  Scheme: `leasetracker://`
  Paths:
  - `leasetracker://invite/:leaseId` → opens `LeaseList` and triggers accept-invite flow
  - `leasetracker://lease/:leaseId` → opens `LeaseDetail`
  Configure in `RootNavigator` and handle in `App.tsx` via `Linking`.

---

## Phase 5 — API Layer

- [ ] **5.1 Create Axios instance — `src/api/client.ts`**
  - `baseURL` from `react-native-config` (`Config.API_BASE_URL`)
  - Request interceptor: attach `Authorization: Bearer <idToken>` from `authStore`
  - Response interceptor: 401 → token refresh + retry (from Phase 3.9)
  - Error normalizer: transform Axios errors to `{ message, statusCode, details }`

- [ ] **5.2 Define TypeScript types — `src/types/api.ts`**
  All types must exactly mirror API response shapes:
  `User`, `Lease`, `LeaseSummary`, `OdometerReading`, `SavedTrip`,
  `AlertConfig`, `LeaseMember`, `SubscriptionStatus`, `MileageHistory`

- [ ] **5.3 Create `leaseApi.ts`**
  ```ts
  getLeases(): Promise<Lease[]>
  getLease(id: string): Promise<Lease>
  createLease(data: CreateLeaseInput): Promise<Lease>
  updateLease(id: string, data: UpdateLeaseInput): Promise<Lease>
  deleteLease(id: string): Promise<void>
  getLeaseSummary(id: string): Promise<LeaseSummary>
  getMileageHistory(id: string): Promise<MileageHistory[]>
  getBuybackAnalysis(id: string, dealerRate: number): Promise<BuybackAnalysis>
  getEndOptions(id: string): Promise<LeaseEndOptions>
  ```

- [ ] **5.4 Create `readingsApi.ts`**
  ```ts
  getReadings(leaseId: string, params?: PaginationParams): Promise<OdometerReading[]>
  addReading(leaseId: string, data: CreateReadingInput): Promise<OdometerReading>
  updateReading(leaseId: string, readingId: string, data: UpdateReadingInput): Promise<OdometerReading>
  deleteReading(leaseId: string, readingId: string): Promise<void>
  ```

- [ ] **5.5 Create `tripsApi.ts`**
  ```ts
  getTrips(leaseId: string): Promise<{ active: SavedTrip[]; completed: SavedTrip[] }>
  createTrip(leaseId: string, data: CreateTripInput): Promise<SavedTrip>
  updateTrip(leaseId: string, tripId: string, data: UpdateTripInput): Promise<SavedTrip>
  deleteTrip(leaseId: string, tripId: string): Promise<void>
  ```

- [ ] **5.6 Create `alertsApi.ts`**

- [ ] **5.7 Create `subscriptionApi.ts`**
  ```ts
  verifyApplePurchase(receiptData: string): Promise<SubscriptionStatus>
  verifyGooglePurchase(productId: string, purchaseToken: string): Promise<SubscriptionStatus>
  getStatus(): Promise<SubscriptionStatus>
  ```

- [ ] **5.8 Create `userApi.ts`**
  ```ts
  getMe(): Promise<User>
  updateMe(data: UpdateUserInput): Promise<User>
  savePushToken(token: string): Promise<void>
  deleteAccount(): Promise<void>
  ```

- [ ] **5.9 Set up `QueryClientProvider` in `App.tsx`**
  Default stale time: 60 seconds. Default cache time: 5 minutes.
  Configure `retry: 1` — don't hammer a down API.

---

## Phase 6 — Home / Dashboard Screen

- [ ] **6.1 Build `DashboardScreen`**
  The first screen after login. Shows the active lease's summary snapshot.
  Layout (top to bottom):
  - Active lease selector (pill tabs — only shown if user has 2+ leases)
  - `MileageProgressRing` — large animated arc, fills as miles are used
  - Headline stats row: Miles Remaining | Days Left | This Month's Miles
  - `PaceStatusBadge` — "On Track", "Slightly Over", "Over Pace"
  - Recommended pace callout: "Drive ≤ X miles/day to stay on track"
  - "Reserved for trips" row (if saved trips exist)
  - Quick-action row: "+ Log Odometer" | "View Full Stats" | "Trips"
  - `BannerAd` at the very bottom (free tier only)

- [ ] **6.2 Build `MileageProgressRing` component**
  - Animated SVG arc using `react-native-svg`
  - Color: green (< 80%), amber (80–95%), red (> 95%)
  - Center text: `{miles_remaining} mi left`
  - Subtle animation on mount (arc draws in)

- [ ] **6.3 Build `PaceStatusBadge` component**
  - `{ color, icon, label }` — green checkmark / amber warning / red alert

- [ ] **6.4 Build `StatCard` component**
  - Props: `label`, `value`, `unit`, `subtext`, `color`
  - Used throughout: "42 days left", "$0.25/mi overarge", etc.

- [ ] **6.5 Build `QuickAddFAB` component**
  - Floating action button pinned to bottom-right
  - Navigates to `AddReadingScreen` for the active lease

- [ ] **6.6 Active lease selector — `LeaseSelectorPills` component**
  Horizontal scroll row of pill buttons, one per lease.
  Selecting a pill updates `activeLeaseId` in a Zustand `leaseStore`.

---

## Phase 7 — Lease Management Screens

- [ ] **7.1 Build `LeaseListScreen`**
  - FlatList of `LeaseCard` components
  - Swipe-left reveals "Archive" action
  - "+" button in header navigates to `AddLeaseScreen`
  - Empty state: "No leases yet. Add your first lease →"

- [ ] **7.2 Build `LeaseCard` component**
  - Vehicle name and year/make/model subtitle
  - Mini horizontal progress bar (miles used / total)
  - Chip row: "X days left" | pace status
  - Shared badge (if user is a member, not owner)

- [ ] **7.3 Build `AddLeaseScreen` — multi-step wizard**
  Progress stepper at top (Steps 1–4).

  **Step 1 — Vehicle**
  - Display name (required — free text, e.g. "Daily Driver")
  - Year, Make, Model (required)
  - Trim, Color (optional)
  - VIN (optional, 17-char validation)
  - License plate (optional)

  **Step 2 — Lease Terms**
  - Lease start date (date picker, required)
  - Lease end date (date picker, must be after start, required)
  - Miles per year (required)
  - Total miles allowed (auto-calculated from years × miles/year, but editable)
  - Starting odometer (required)
  - Overage cost per mile (required, e.g. $0.25)

  **Step 3 — Optional Details**
  - Monthly payment
  - Dealer name and phone
  - Contract number
  - MPG estimate (used for carbon footprint)
  - Notes

  **Step 4 — Review & Save**
  - Summary of all entered values
  - "Add Lease" button
  - "Back" to edit any step

- [ ] **7.4 Build `EditLeaseScreen`**
  - Same form as AddLease, pre-populated from existing data
  - "Archive Lease" destructive button (soft-delete) at bottom
  - "Transfer Ownership" option (if user is owner and has members)

- [ ] **7.5 Build `LeaseDetailScreen`**
  - Full stats section (mirrors dashboard but for this specific lease)
  - "Odometer Log" row with latest reading and "View All" → `OdometerLogScreen`
  - "Saved Trips" row with count → `TripsStack`
  - "Shared With" row (members avatars) → member management
  - "Lease Info" collapsible panel: dealer, contract #, VIN, etc.
  - "End of Lease Tools" section: Buyback analysis, End options, Turn-in checklist

---

## Phase 8 — Odometer Reading Screens

- [ ] **8.1 Build `OdometerLogScreen`**
  - `SectionList` grouped by month (e.g. "March 2026 — 847 miles driven")
  - Each row: date, odometer reading, delta from previous entry, source badge
  - Pull-to-refresh
  - Swipe-left reveals "Delete" with confirmation
  - FAB to add a new reading

- [ ] **8.2 Build `AddReadingScreen`**
  - Large number input for odometer (custom `OdometerInput` component)
  - Date picker (defaults to today)
  - Notes text field
  - "Use Camera (OCR)" option — stubs to Phase 14 camera feature
  - Real-time `ReadingImpactCard` preview updates as user types
  - Validation error shown inline if reading is below current odometer
  - "Save Reading" button

- [ ] **8.3 Build `OdometerInput` component**
  - Stylized large-font number display with comma separator
  - Custom numeric keypad or platform keyboard with `keyboardType="number-pad"`
  - Shows current lease odometer as a "previous reading" hint

- [ ] **8.4 Build `ReadingImpactCard` component**
  - Live preview card shown below odometer input
  - Shows: projected new pace, whether this reading improves or worsens outlook
  - Example: "After this entry you'll be 312 miles ahead of pace ↑"

---

## Phase 9 — Pace & Analytics Screens

- [ ] **9.1 Build `PaceDetailScreen`**
  - Accessible via "View Full Stats" from Dashboard
  - Contains:
    - `ProjectionChart` — expected vs actual miles over lease timeline
    - `MonthlyMileageChart` — miles driven per calendar month (bar chart)
    - Detailed stats table: days forward/behind, cost at current pace, etc.
    - Annual rollover switcher: "Full Lease" vs "This Year" toggle

- [ ] **9.2 Build `ProjectionChart` component**
  - Line chart using `react-native-gifted-charts`
  - X-axis: timeline (lease start → today → lease end)
  - Lines: "Expected" (straight diagonal) and "Actual" (your readings)
  - Projected line extending from today to lease end at current pace
  - Color-coded projection: green (on track) / red (over pace)

- [ ] **9.3 Build `MonthlyMileageChart` component**
  - Bar chart of miles driven per calendar month
  - Shows expected monthly allowance as a threshold line

- [ ] **9.4 Build `BuybackAnalysisScreen`** _(premium-gated)_
  - Input: dealer's quoted buy-back rate per mile
  - Output: whether buying miles now vs paying at turn-in is cheaper
  - Visual cost comparison side-by-side
  - "Premium" lock overlay for free users with upgrade CTA

- [ ] **9.5 Build `LeaseEndOptionsScreen`** _(premium-gated)_
  - Three-column comparison: Return | Buy Out | Roll to New Lease
  - Each column shows estimated total cost with breakdown
  - Recommendation badge on cheapest option

---

## Phase 10 — Saved Trips Screens

- [ ] **10.1 Build `TripsListScreen`**
  - Lease selector pill at top (if multiple leases)
  - "Active" section and "Completed" section
  - Each `TripCard`: name, estimated miles, trip date, "−X miles from budget" impact
  - Completed trips show muted styling and green checkmark
  - FAB to add a trip
  - Empty state: "No trips saved. Plan ahead and save miles for your next trip."

- [ ] **10.2 Build `TripCard` component**
  - Trip name, miles, date
  - Impact line: "Uses {miles} of your {remaining} remaining miles"
  - "Mark Complete" swipe action or tap

- [ ] **10.3 Build `AddTripScreen`**
  - Trip name (required)
  - Estimated miles (required, > 0)
  - Date picker (optional)
  - Notes (optional)
  - Live impact preview: "After saving this trip, you'll have {X} mi available"
  - "Save Trip" button

- [ ] **10.4 Build `EditTripScreen`**
  - Same form as Add, pre-populated
  - "Mark as Completed" toggle
  - "Delete Trip" destructive button

---

## Phase 11 — Push Notifications

- [ ] **11.1 Request push notification permission on first app launch**
  - Show a custom "Allow Notifications" modal explaining value
    ("Get alerts when you're approaching your mileage limit")
  - Only then call `messaging().requestPermission()`
  - Store granted/denied status in AsyncStorage to avoid re-prompting

- [ ] **11.2 Register device token and sync to API**
  - On permission granted (or confirmed on each app launch if already granted),
    call `messaging().getToken()` and `userApi.savePushToken(token)`
  - Handle token refresh with `messaging().onTokenRefresh()` listener

- [ ] **11.3 Handle foreground notifications**
  - Use `notifee.displayNotification()` to show in-app banner
  - Include `leaseId` in notification data for navigation

- [ ] **11.4 Handle background and quit-state notification taps**
  - `messaging().getInitialNotification()` — handle tap from quit state
  - `messaging().onNotificationOpenedApp()` — handle tap from background
  - Navigate to the relevant `LeaseDetailScreen` based on `leaseId` in the payload

- [ ] **11.5 Build `AlertSettingsScreen`**
  - Per-lease section (user selects which lease to configure)
  - Toggle rows for each alert type:
    - "Approaching mileage limit" with percentage slider (default 80%)
    - "Over pace this month"
    - "Lease ends soon" with day picker (default 30 days)
    - "Saved trip coming up" (3 days before trip date)
  - "Test notification" button (visible in development builds only)

---

## Phase 12 — Subscriptions (In-App Purchases)

- [ ] **12.1 Configure IAP products in App Store Connect**
  - `com.yourcompany.leasetracker.premium_monthly` — Auto-Renewable Subscription
  - `com.yourcompany.leasetracker.premium_yearly` — Auto-Renewable Subscription
  - Subscription group: "LeaseTracker Premium"
  - Set up promotional offer for annual plan

- [ ] **12.2 Configure IAP products in Google Play Console**
  - Same product IDs as iOS
  - Base plan with monthly and yearly pricing phases

- [ ] **12.3 Create `useSubscription` hook — `src/hooks/useSubscription.ts`**
  - Fetches `subscriptionApi.getStatus()` via TanStack Query
  - Exposes `isPremium: boolean`, `expiresAt: string | null`, `isLoading`
  - Re-fetches on app foreground (user may have subscribed via web)

- [ ] **12.4 Build `SubscriptionScreen`**
  - Hero section with "Go Premium" headline and feature list:
    - ✓ Unlimited leases
    - ✓ Detailed charts & projections
    - ✓ Buyback and lease-end analysis
    - ✓ Lease sharing with family/co-drivers
    - ✓ Ad-free experience
  - Two pricing tiles: Monthly / Yearly (highlight yearly with "Best Value" chip)
  - "Subscribe" button → triggers purchase flow
  - "Restore Purchases" text link
  - Required legal footer: Terms of Service | Privacy Policy | Billing terms

- [ ] **12.5 Implement purchase flow**
  ```ts
  await initConnection()
  const products = await getSubscriptions({ skus: [monthlyId, yearlyId] })
  await requestSubscription({ sku })
  // On purchaseUpdatedListener success:
  await subscriptionApi.verifyApplePurchase(receipt) // or verifyGoogle
  queryClient.invalidateQueries(['subscription'])
  ```

- [ ] **12.6 Implement "Restore Purchases"**
  Call `getAvailablePurchases()`, re-verify the most recent active receipt with API.

- [ ] **12.7 Gate premium features behind `isPremium`**
  Create a reusable `PremiumGate` component:
  - If `isPremium` → render `children`
  - If not → render a locked overlay card with "Unlock with Premium" button
    that navigates to `SubscriptionScreen`

  Apply `PremiumGate` to:
  - Charts on `PaceDetailScreen`
  - `BuybackAnalysisScreen`
  - `LeaseEndOptionsScreen`
  - 3rd+ lease creation (allow 2 free leases)
  - Lease sharing features

---

## Phase 13 — Ads (Free Tier)

- [ ] **13.1 Configure AdMob**
  - Register app in Google AdMob console
  - Create banner ad units for iOS and Android
  - Add AdMob App IDs to `Info.plist` (`GADApplicationIdentifier`) and
    `AndroidManifest.xml` (`<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID">`)

- [ ] **13.2 Create `BannerAdView` component — `src/components/ads/BannerAdView.tsx`**
  - Renders `BannerAd` from `react-native-google-mobile-ads`
  - Use `BannerAdSize.ANCHORED_ADAPTIVE_BANNER` for best fill rate
  - Only renders when `!isPremium`
  - Safe area aware (does not overlap home indicator / nav bar)

- [ ] **13.3 Add `BannerAdView` to `DashboardScreen` (bottom)**

- [ ] **13.4 Add `BannerAdView` to `LeaseListScreen` (below the list)**

- [ ] **13.5 Add `BannerAdView` to `OdometerLogScreen` (below the list)**

- [ ] **13.6 Use test ad unit IDs during development**
  Configure via `react-native-config`: `AD_BANNER_UNIT_ID` different per environment.

---

## Phase 14 — Standout & Advanced Features

These features differentiate LeaseTracker from generic mileage apps.

- [ ] **14.1 OCR Odometer Reading (Camera)**
  - Install: `npm install react-native-vision-camera react-native-mlkit-ocr`
  - Build `OdometerCameraScreen`: show camera preview, capture, run OCR
  - Parse the largest 5–6 digit number from OCR results
  - Pre-fill `AddReadingScreen`'s odometer field with the parsed value
  - User confirms or corrects before saving

- [ ] **14.2 Annual Rollover View**
  - Add "This Year" / "Full Lease" toggle to `DashboardScreen` and `PaceDetailScreen`
  - "This Year" resets the expected pace baseline to the current lease year anniversary
  - Useful for users who are behind overall but on track this year

- [ ] **14.3 Home Screen Widget — iOS**
  - Create native Swift Widget Extension in Xcode
  - Widget displays: miles remaining, pace status badge, days to end
  - Data source: shared `UserDefaults` suite written by the app on each summary fetch
  - Sizes: small (status only) and medium (status + pace + days)

- [ ] **14.4 Home Screen Widget — Android**
  - Install `react-native-android-widget`
  - Same data as iOS widget
  - Tapping the widget opens `DashboardScreen`

- [ ] **14.5 Lease Turn-In Checklist Screen**
  - Pre-built checklist categories: Exterior Damage | Interior Condition | Tires |
    Windshield | Excess Wear Items | Keys & Remotes
  - Each item: status (OK / Minor / Damage) + optional photo
  - "Generate Checklist Report" → share as an image collage (using `react-native-view-shot`)
  - Useful for documenting the car's condition at return to avoid dealer disputes

- [ ] **14.6 Lease Sharing / Multiple Drivers**
  - `ShareLeaseScreen`: enter invitee's email, select role (editor / viewer)
  - Deep link recipient accepts invite → they see the lease in their app
  - Odometer log shows "Logged by [Name]" attribution per entry
  - Dashboard shows "shared with X people" indicator

- [ ] **14.7 Carbon Footprint Tracker**
  - If MPG is entered on the lease, compute:
    `CO₂ lbs = miles_driven / mpg * 19.6` (EPA factor)
  - Show as a "Fun Fact" card on `LeaseDetailScreen`
  - Equivalent trees / driving equivalent comparisons for engagement

- [ ] **14.8 Mileage Buy-Back Alert (smart alert)**
  - When projected overage cost exceeds a configurable threshold ($50 default),
    send a push notification proactively:
    "You're on track to owe ~$124 at turn-in. Consider buying miles now."
  - Tapping navigates to `BuybackAnalysisScreen`

- [ ] **14.9 "How am I doing?" weekly summary notification**
  - Every Monday morning: push notification with the week's mileage summary
  - "Last week: 312 miles. You're 47 miles ahead of pace. Keep it up! 🟢"
  - Configurable on/off in `AlertSettingsScreen`

- [ ] **14.10 Lease comparison view (premium)**
  - Side-by-side comparison card for users with 2+ leases
  - Shows: pace status, miles remaining, days left per vehicle
  - Helpful for families or fleet users

---

## Phase 15 — Settings Screen

- [ ] **15.1 Build `SettingsScreen`**
  Sections:
  - **Account** — display name, email (read-only), profile initial avatar
  - **Subscription** — tier badge, "Manage / Upgrade" → `SubscriptionScreen`
  - **Notifications** → `AlertSettingsScreen`
  - **Appearance** — Light / Dark / System (persisted in AsyncStorage)
  - **Default Lease** — picker for users with multiple leases (sets dashboard default)
  - **App**
    - Rate the App (links to App Store / Play Store)
    - Share the App
    - Help & FAQ
    - Privacy Policy
    - Terms of Service
    - App version (read from `package.json`, shown as subtitle)
  - **Sign Out** (button, destructive styling)
  - **Delete Account** (button, bottom of screen, destructive with confirmation modal)

- [ ] **15.2 Build `AccountScreen`**
  - Edit display name (inline save)
  - Change password → routes through `ForgotPasswordScreen` flow
  - "Signed in as [email]" informational row

- [ ] **15.3 Implement Dark Mode**
  - Use `useColorScheme()` as default; allow manual override stored in AsyncStorage
  - Apply `isDark ? theme.dark : theme.light` to all screens and components

---

## Phase 16 — App Store Preparation

- [ ] **16.1 Design app icon**
  - 1024×1024 master (no alpha channel — App Store rejects transparency)
  - Export all required sizes via Xcode Asset Catalog
  - Android: export to all `mipmap-*` density buckets
  - Suggested concept: stylized speedometer or odometer with a leaf/road element

- [ ] **16.2 Design and implement splash screen**
  - Run `npx react-native generate-bootsplash` with branded assets
  - Hide splash after auth hydration completes in `App.tsx`

- [ ] **16.3 Set app bundle ID and display name**
  - iOS: update `Info.plist` (`CFBundleIdentifier`, `CFBundleDisplayName`)
    and `project.pbxproj` via Xcode
  - Android: update `applicationId` in `android/app/build.gradle`
    and `app_name` in `strings.xml`

- [ ] **16.4 Configure `Info.plist` for iOS privacy strings**
  - `NSCameraUsageDescription` — "Used to read your odometer via photo"
  - `NSPhotoLibraryUsageDescription` — "Used to save your odometer photo"
  - `NSUserNotificationsUsageDescription` — "To alert you when approaching your mileage limit"
  - Update `PrivacyInfo.xcprivacy` privacy manifest (required for App Store)

- [ ] **16.5 Configure `AndroidManifest.xml` permissions**
  - `CAMERA`, `INTERNET`, `RECEIVE_BOOT_COMPLETED`, `POST_NOTIFICATIONS` (Android 13+)
  - `com.android.vending.BILLING` (IAP)

- [ ] **16.6 Configure iOS signing (Release)**
  - Create App ID in Apple Developer portal (matches bundle ID)
  - Create App Store Distribution certificate
  - Create App Store provisioning profile
  - Configure in Xcode → Signing & Capabilities

- [ ] **16.7 Configure Android signing (Release)**
  ```
  keytool -genkey -v -keystore release.keystore -alias leasetracker \
    -keyalg RSA -keysize 2048 -validity 10000
  ```
  - Configure `signingConfigs` in `android/app/build.gradle`
  - Store keystore file and credentials in a secure location (not git)
  - Add `MYAPP_RELEASE_*` vars to `~/.gradle/gradle.properties`

- [ ] **16.8 Build production iOS IPA**
  - Archive via Xcode Product → Archive
  - Distribute via TestFlight

- [ ] **16.9 Build production Android AAB**
  ```
  cd android && ./gradlew bundleRelease
  ```

- [ ] **16.10 Create App Store Connect listing**
  - App name: "LeaseTracker — Mileage Manager"
  - Subtitle (30 chars): "Track your car lease miles"
  - Keywords (100 chars): `lease,mileage,tracker,car,auto,overage,odometer,miles,vehicle,budget`
  - Description: full feature description
  - Screenshots: 6.7" (iPhone Pro Max), 6.1" (iPhone), iPad
  - Privacy policy URL (host a simple page)
  - Support URL

- [ ] **16.11 Create Google Play Console listing**
  - Short description (80 chars)
  - Full description (4000 chars)
  - Feature graphic (1024×500)
  - Screenshots (phone + 7" tablet)
  - Content rating questionnaire
  - Privacy policy URL
  - Data safety form (declare what data is collected)

- [ ] **16.12 Submit to TestFlight for internal testing (5 builds minimum)**

- [ ] **16.13 Submit to Google Play Internal Testing track**

- [ ] **16.14 Beta test with real users (10+ users, real leases)**
  - Validate summary calculation accuracy against users' actual lease contracts
  - Identify UX friction in the Add Lease wizard
  - Verify push notifications arrive on both platforms

- [ ] **16.15 Address beta feedback and fix critical bugs**

- [ ] **16.16 Submit to App Store Review**
  - Review guidelines to double-check before submission:
    - IAP must use Apple's system (not web payment links)
    - Subscription terms clearly shown before purchase
    - Privacy policy accessible without logging in

- [ ] **16.17 Submit to Google Play Review**

- [ ] **16.18 App launch / marketing**
  - ASO (App Store Optimization): monitor keyword rankings
  - Set up crash reporting (Firebase Crashlytics — already included via Firebase)
  - Set up analytics events (Firebase Analytics)
  - Create a landing page for the app

---

## Phase 17 — Testing

- [ ] **17.1 Unit tests — auth store**
  - Login / logout state transitions
  - Token hydration from AsyncStorage

- [ ] **17.2 Unit tests — lease calculation utilities**
  - Extract any client-side calculations into `src/utils/leaseCalculations.ts`
  - Match the same logic tested in the API

- [ ] **17.3 Component tests — key screens**
  - `LoginScreen` — form validation errors surface correctly
  - `AddLeaseScreen` — wizard step transitions, back navigation
  - `DashboardScreen` — renders with mocked `LeaseSummary`

- [ ] **17.4 Mock API layer in tests**
  - Use `msw` (Mock Service Worker) or `jest.mock` to stub API calls

- [ ] **17.5 E2E tests with Detox**
  - Happy path: register → add lease → log odometer → verify dashboard updates
  - Multiple lease: add second lease → switch via pill selector
  - Free tier ad: verify banner is visible for free user
  - Premium gate: verify locked overlay shows for free user on charts
  - Subscription: complete purchase flow in sandbox → verify ad disappears
