
# Fresh Start: Rewrite Authentication Flow

## What Gets Replaced (5 files)

1. **`src/contexts/AuthContext.tsx`** - Complete rewrite with simpler, proven pattern
2. **`src/pages/Auth.tsx`** - Clean login page without patches
3. **`src/components/subscription/SubscriptionGate.tsx`** - Simpler paywall logic
4. **`src/components/subscription/ManageSubscription.tsx`** - Keep as-is (already simple)
5. **`src/App.tsx`** - Simplified route protection

## What Stays Unchanged

- All practice log components (`src/components/practice-log/*`)
- Staff paper page and components
- All hooks except auth-related ones
- UI components, styling, everything else

## New Architecture

### Simple, Battle-Tested Pattern

```text
┌─────────────────────────────────────────────────────────┐
│                    AuthProvider                         │
│  - Manages user/session state                           │
│  - Single subscription check on auth state change       │
│  - Exposes: user, loading, subscription, signIn/Out     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    App.tsx Routes                        │
│  - /auth: Show if NOT logged in                         │
│  - /: Protected, requires login                         │
│  - SubscriptionGate wraps protected content             │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  SubscriptionGate                        │
│  - Wait for subscription check to complete              │
│  - Show paywall if not subscribed                       │
│  - Show children if subscribed                          │
│  - No navigation, just conditional rendering            │
└─────────────────────────────────────────────────────────┘
```

### Key Differences from Current Code

| Current (Broken) | New (Simpler) |
|------------------|---------------|
| Navigation after login based on subscription | Let React Router handle it, SubscriptionGate just renders paywall or content |
| Multiple useEffects watching state | Single auth state listener |
| `checkSubscription()` called from multiple places | Called once when auth state changes |
| Hard navigation with `window.location.href` | React Router navigation only |
| `show_paywall` query params | No query params needed |
| `initialCheckDone`, `justSignedIn` flags | Just `loading` boolean |

## Implementation Details

### 1. New AuthContext.tsx (~80 lines instead of 250)

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: {
    status: 'loading' | 'active' | 'inactive';
    isTrialing: boolean;
    endDate: string | null;
  };
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}
```

Core logic:
- Single `onAuthStateChange` listener
- When session appears, fetch subscription status
- When session disappears, reset subscription to inactive
- No complex ref tracking or promise deduplication

### 2. New Auth.tsx (~60 lines instead of 130)

- Simple form with email/password
- Call `signIn()`, show error if any
- No navigation logic - let ProtectedRoute/PublicRoute handle it
- No subscription checking here at all

### 3. New SubscriptionGate.tsx (~40 lines instead of 150)

```typescript
function SubscriptionGate({ children }) {
  const { subscription } = useAuth();

  if (subscription.status === 'loading') {
    return <LoadingSpinner />;
  }

  if (subscription.status === 'inactive') {
    return <PaywallUI />;
  }

  return <>{children}</>;
}
```

No useEffects, no navigation, no query params - just render based on state.

### 4. Updated App.tsx

```typescript
function ProtectedRoute({ children }) {
  const { user, loading, subscription } = useAuth();

  // Wait for auth to initialize
  if (loading) return <Spinner />;
  
  // Not logged in? Go to auth
  if (!user) return <Navigate to="/auth" />;

  // Logged in - render children (SubscriptionGate handles paywall)
  return <>{children}</>;
}
```

## Why This Will Work

1. **No race conditions**: We don't navigate based on subscription status. The page renders what it should based on current state.

2. **Single source of truth**: AuthContext manages everything. Components just read state.

3. **Safari compatible**: No complex timing, no hard navigations needed.

4. **Debuggable**: Simple state machine: loading → active/inactive. Easy to trace.

## Files to Create/Replace

| File | Action |
|------|--------|
| `src/contexts/AuthContext.tsx` | Replace completely |
| `src/pages/Auth.tsx` | Replace completely |
| `src/components/subscription/SubscriptionGate.tsx` | Replace completely |
| `src/App.tsx` | Simplify route protection |

## Testing Checklist

1. Sign in with subscribed account → see journal
2. Sign in with non-subscribed account → see paywall
3. Refresh page while logged in → stay on correct page
4. Sign out → go to auth page
5. Try to access / without login → redirect to auth
6. "Refresh status" on paywall → correctly updates if now subscribed
