# Frontend Project - Quick Reference Guide

## 🎯 Project at a Glance

**Tech Stack:**

- React 19 + TypeScript 5
- Vite (Build tool)
- Tailwind CSS (Styling)
- React Router v7 (Navigation)
- TanStack Query v5 (Server state)
- Zustand (Client state)
- React Hook Form + Zod (Forms & validation)
- Axios (HTTP client)
- Framer Motion (Animations)

**Total Dependencies: 30+ libraries**

---

## 📁 Project Structure (Detailed)

```
frontend/
│
├── src/
│   ├── app/
│   │   ├── layout/
│   │   │   ├── layout-client.tsx          # Client layout (profile, etc)
│   │   │   └── layout-main.tsx            # Admin layout (dashboard, users)
│   │   └── providers/
│   │       ├── theme-provider.tsx         # Dark/Light theme
│   │       ├── suspense-provider.tsx      # React.lazy fallback
│   │       └── query-provider.tsx         # React Query setup
│   │
│   ├── components/
│   │   ├── ui/                            # Reusable base components
│   │   │   ├── button.tsx                 # CVA variant-based button
│   │   │   ├── input.tsx                  # Text input
│   │   │   ├── form.tsx                   # React Hook Form wrapper
│   │   │   ├── card.tsx                   # Card container
│   │   │   ├── checkbox.tsx               # Checkbox (Radix UI)
│   │   │   ├── dropdown-menu.tsx          # Dropdown menu
│   │   │   ├── tabs.tsx                   # Tab component
│   │   │   └── ... (15+ more)
│   │   │
│   │   ├── auth/
│   │   │   └── protected-route.tsx        # Route guard component
│   │   │
│   │   ├── header-nav/                    # Navigation header
│   │   ├── theme/                         # Theme switcher
│   │   ├── language/                      # Language selector
│   │   ├── animated/                      # Animation wrappers
│   │   └── index.ts                       # Barrel exports
│   │
│   ├── core/
│   │   ├── configs/
│   │   │   ├── env.ts                     # Environment variables
│   │   │   ├── consts.ts                  # App constants & enums
│   │   │   └── is-equal.ts                # Equality check utility
│   │   │
│   │   ├── constants/
│   │   │   └── path.ts                    # All route paths
│   │   │
│   │   ├── helpers/
│   │   │   ├── error-handler.ts           # Unified error handling
│   │   │   ├── key-tanstack.ts            # Query cache keys
│   │   │   └── common.ts                  # Common constants
│   │   │
│   │   ├── lib/
│   │   │   ├── cn.ts                      # classname merger (clsx + tailwind-merge)
│   │   │   ├── variant/
│   │   │   │   └── style-variant.ts       # Framer motion variants
│   │   │   └── toastify-common.ts         # Toast notifications
│   │   │
│   │   ├── services/
│   │   │   ├── axios-client.ts            # Axios + interceptors setup
│   │   │   │   ├── Request interceptor    # Add auth token
│   │   │   │   └── Response interceptor   # Handle 401, refresh token
│   │   │   └── auth.service.ts            # API endpoints (factory pattern)
│   │   │
│   │   ├── shared/
│   │   │   └── storage.ts                 # LocalStorage helpers
│   │   │
│   │   ├── store/
│   │   │   └── features/
│   │   │       ├── auth/
│   │   │       │   └── authStore.ts       # Zustand auth state
│   │   │       └── sidebar/
│   │   │           └── sidebarStore.ts    # Zustand sidebar state
│   │   │
│   │   └── zod/
│   │       ├── login.zod.ts               # Login validation
│   │       ├── register.zod.ts            # Register validation
│   │       ├── verify-account-email.zod.ts
│   │       └── reset-password.zod.ts
│   │
│   ├── hooks/
│   │   ├── auth/
│   │   │   ├── use-auth-redirect.ts       # Auto-redirect if logged in
│   │   │   └── use-auth.ts                # Get current user
│   │   │
│   │   ├── routes/
│   │   │   └── use-router-element.tsx     # Route configuration
│   │   │
│   │   ├── tanstack-query/
│   │   │   ├── auth/
│   │   │   │   └── use-query-auth.ts      # Login, register, verify OTP
│   │   │   └── users/
│   │   │       └── use-query-users.ts     # Fetch users
│   │   │
│   │   ├── use-click-outside.ts           # Detect click outside
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── login/
│   │   │   └── Login.tsx
│   │   ├── register/
│   │   │   └── Register.tsx
│   │   ├── forgot-password/
│   │   │   └── ForgotPassword.tsx
│   │   ├── verify-account-email/
│   │   │   └── VerifyAcountEmail.tsx
│   │   ├── reset-password/
│   │   │   └── ResetPassword.tsx
│   │   ├── home/
│   │   │   └── HomePage.tsx
│   │   ├── profile/
│   │   │   ├── Profile.tsx
│   │   │   └── ProfileEdit.tsx
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   └── index.tsx
│   │   │   └── users/
│   │   │       └── index.tsx
│   │   └── 404/
│   │       └── PageNotFound.tsx
│   │
│   ├── models/
│   │   ├── interface/
│   │   │   ├── auth.interface.ts          # Auth types (LoginRequest, User, etc)
│   │   │   ├── user.interface.ts
│   │   │   └── common.interface.ts
│   │   │
│   │   └── types/
│   │       └── ... (additional types)
│   │
│   ├── styles/
│   │   ├── global.css                     # Global styles
│   │   ├── theme.css                      # CSS variables for theming
│   │   ├── style-guide.md                 # Design system documentation
│   │   └── variant/
│   │       └── style-variant.ts           # Animation variants
│   │
│   ├── locales/
│   │   ├── i18n.ts                        # i18next config
│   │   ├── en/
│   │   │   └── translation.json           # English translations
│   │   └── vi/
│   │       └── translation.json           # Vietnamese translations
│   │
│   ├── assets/
│   │   ├── icons/                         # SVG/React icons
│   │   ├── images/                        # Images
│   │   └── fonts/                         # Custom fonts
│   │
│   ├── _mocks/
│   │   ├── data-nav-bar.mock.ts           # Mock navigation data
│   │   └── data-stack.mock.ts             # Mock stack data
│   │
│   ├── __tests__/
│   │   └── components/                    # Component tests
│   │
│   ├── App.tsx                            # Root component
│   ├── main.tsx                           # Entry point
│   └── vite-env.d.ts                      # Vite env types
│
├── public/
│   ├── bg.jpg                             # Background image
│   └── favicon.ico
│
├── Configuration Files
│   ├── package.json                       # Dependencies & scripts
│   ├── tsconfig.json                      # TypeScript config
│   ├── tsconfig.app.json                  # App TypeScript config
│   ├── tsconfig.node.json                 # Node TypeScript config
│   ├── vite.config.ts                     # Vite config
│   ├── tailwind.config.js                 # Tailwind config
│   ├── postcss.config.js                  # PostCSS config
│   ├── eslint.config.js                   # ESLint rules
│   ├── jest.config.cjs                    # Jest config
│   ├── jest.setup.cjs                     # Jest setup
│   ├── babel.config.cjs                   # Babel config
│   ├── .prettierrc                        # Code formatter
│   ├── components.json                    # shadcn config
│   └── commitlint.config.cjs              # Commit message rules
│
└── README.md
```

---

## 🔄 Data Flow Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                  USER INTERACTION                        │
│  Click Login → Login.tsx (Component)                    │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                  FORM VALIDATION                         │
│  React Hook Form + Zod Schema validation                │
│  ✓ Email format valid?                                  │
│  ✓ Password length valid?                               │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│              BUSINESS LOGIC (Custom Hook)               │
│  useLoginAuth() from hooks/tanstack-query/auth          │
│  → Call authApi.login(data)                             │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│               API SERVICE LAYER                          │
│  authApi.login() from core/services/auth.service        │
│  → axiosClient.post('/auth/login', data)                │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│              HTTP INTERCEPTOR                            │
│  ✓ Add Authorization header                             │
│  ✓ Handle request/response                              │
│  ✓ Manage token refresh (401 error)                     │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                 BACKEND API                              │
│  /auth/login → Database query → Return tokens           │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│            STORE TOKENS & USER INFO                      │
│  1. Save to localStorage (access_token, refresh_token)  │
│  2. Update Zustand store (useAuthStore)                 │
│  3. Set user in localStorage                            │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                  REDIRECT                                │
│  navigate('/dashboard') or '/admin/dashboard'           │
└─────────────────────────────────────────────────────────┘
```

### Component Rendering Flow

```
App.tsx
  ↓
ThemeProvider (provides theme context)
  ↓
AutoScrollToTop (scroll behavior)
  ↓
useRoutesElements() (routing)
  ↓
  ├─ Public Routes: Login, Register, etc.
  │   └─ Rendered directly
  │
  └─ Protected Routes: Dashboard, Profile, etc.
      ↓
      ProtectedRoute (checks token)
        ↓
        if (!token) → redirect to /login
        else → render LayoutMain/LayoutClient
          ↓
          Render nested routes (Dashboard, Users, etc.)
```

---

## 🎨 Styling Architecture

### CSS Variable System

```css
/* theme.css */
:root {
  /* Colors */
  --primary: #6366f1;
  --primary-foreground: white;
  --background-primary: white;
  --background-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;

  /* Border Radius */
  --radius-xss: 0.25rem;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;

  /* Typography */
  --font-size-h1: 2.5rem;
  --font-weight-h1: 700;
  --line-height-h1: 3rem;
}

/* Dark mode */
[data-theme='dark'] {
  --background-primary: #1a1a1a;
  --text-primary: white;
}
```

### Tailwind Integration

```typescript
// tailwind.config.js
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--background-primary)',
          secondary: 'var(--background-secondary)'
        }
      },
      fontSize: {
        h1: ['var(--font-size-h1)', { fontWeight: 'var(--font-weight-h1)' }]
      }
    }
  }
}
```

---

## 🔐 Authentication State Management

### Multi-Layer State

```typescript
// Layer 1: LocalStorage (Persistent)
localStorage.setItem('access_token', token)
localStorage.setItem('user', JSON.stringify(user))

// Layer 2: Zustand Store (Runtime)
useAuthStore((state) => state.user)

// Layer 3: React Query Cache (Server State)
useQuery({ queryKey: ['me'], queryFn: () => authApi.getMe() })
```

### Token Refresh Strategy

```typescript
// axios-client.ts
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // 401: Token expired
    if (error.response?.status === 401) {
      const refreshToken = getRefreshTokenFromLS()
      const response = await authApi.refreshToken(refreshToken)

      // Update tokens
      setAccessTokenToLS(response.access_token)
      setRefreshTokenToLS(response.refresh_token)

      // Retry original request
      return axiosClient(error.config)
    }
  }
)
```

---

## 📊 Form Handling Pattern

```typescript
// Step 1: Define validation schema
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

// Step 2: Create form with validation
const form = useForm({
  resolver: zodResolver(LoginSchema)
})

// Step 3: Render form fields
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// Step 4: Handle submission
form.handleSubmit(onSubmit)
```

---

## 🚀 npm Scripts

```bash
# Development
npm run dev              # Start dev server on :4000

# Building & Production
npm run build           # Build for production (tsc + vite)
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run check:type      # TypeScript type checking
npm run check:lint      # ESLint with auto-fix
npm run check:prettier  # Format code with Prettier
npm run check:all       # All checks combined

# Testing
npm run test            # Run Jest tests

# Git Hooks
npm run prepare         # Setup Husky git hooks
```

---

## 🔗 Key Integration Points

### 1. API Endpoints Configuration

```typescript
// core/services/auth.service.ts
const API_LOGIN_URL = '/auth/login'
const API_REGISTER_URL = '/auth/register'
const API_VERIFY_EMAIL_URL = '/auth/verify-email'
const API_REFRESH_TOKEN_URL = '/auth/refresh-token'
const API_RESET_PASSWORD_URL = '/auth/reset-password'
const API_LOGOUT_URL = '/auth/logout'
```

### 2. Route Protection

```typescript
// Public Routes (No auth needed)
/login, /register, /forgot-password, /verify-account-email

// Protected Routes (Auth needed)
/profile, /admin/*, /dashboard
```

### 3. State Persistence

```typescript
// What persists?
✓ access_token         (localStorage)
✓ refresh_token        (localStorage)
✓ user info            (localStorage)
✓ theme preference     (localStorage)
✓ language             (localStorage)
✓ sidebar state        (Zustand)
```

---

## 🎓 Common Patterns Used

### Pattern 1: Factory Pattern (Services)

```typescript
export const createAuthApi = (client: AxiosInstance) => ({
  login: (data) => client.post('/auth/login', data),
  register: (data) => client.post('/auth/register', data)
})

export const authApi = createAuthApi(axiosClient)
```

### Pattern 2: Custom Hooks (Logic Reuse)

```typescript
export const useLoginAuth = () => {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data) => authApi.login(data),
    onSuccess: (response) => {
      // Handle success
      navigate('/dashboard')
    }
  })
}
```

### Pattern 3: Compound Components

```typescript
export const Form = ({ children }) => <form>{children}</form>
export const FormField = ({ name, control, render }) => <Field {...} />
export const FormLabel = ({ children }) => <label>{children}</label>
export const FormControl = ({ children }) => <div>{children}</div>

// Usage
<Form>
  <FormField>
    <FormLabel>Email</FormLabel>
    <FormControl>
      <Input />
    </FormControl>
  </FormField>
</Form>
```

### Pattern 4: Hook Composition

```typescript
// Combine multiple hooks
export const useAuthenticatedUser = () => {
  const { user } = useAuthStore()
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user
  })
  return { user, profile }
}
```

---

## ⚡ Performance Optimizations

### 1. Code Splitting (Lazy Load)

```typescript
const HomePage = lazy(() => import('@/pages/home/HomePage'))
const Dashboard = lazy(() => import('@/pages/admin/dashboard'))

// Wrapped with Suspense
<Suspense fallback={<Loading />}>
  <HomePage />
</Suspense>
```

### 2. Request Deduplication (React Query)

```typescript
// Same request made twice → Only 1 API call
useQuery({ queryKey: ['users'], queryFn: () => fetchUsers() })
useQuery({ queryKey: ['users'], queryFn: () => fetchUsers() })
```

### 3. Cache Management

```typescript
staleTime: 5 * 60 * 1000 // 5 min cache
gcTime: 10 * 60 * 1000 // 10 min garbage collect
```

### 4. Request Cancellation

```typescript
// Abort previous request if new one is made
const controllers = new Map()
const controller = new AbortController()
config.signal = controller.signal
```

---

## 🐛 Debugging Tips

### 1. React Query DevTools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### 2. Console Logging in Zustand

```typescript
export const useAuthStore = create(
  (set) => ({
    // ...
  }),
  devtools // Enable Redux DevTools
)
```

### 3. Check Token in Console

```typescript
// Browser console
localStorage.getItem('access_token')
localStorage.getItem('user')
```

---

## 📌 Important Files to Study First

1. **src/App.tsx** - Entry point, theme setup
2. **src/core/services/auth.service.ts** - API layer
3. **src/core/services/axios-client.ts** - HTTP setup
4. **src/hooks/tanstack-query/auth/use-query-auth.ts** - Business logic
5. **src/pages/login/Login.tsx** - Complete example
6. **src/components/auth/protected-route.tsx** - Route protection

---

## ✅ Checklist Before Shipping

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings fixed
- [ ] Components tested
- [ ] API endpoints working
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Responsive design checked
- [ ] Theme switching works
- [ ] Translations complete
- [ ] Performance optimized
- [ ] Accessibility checked (a11y)

---

**Last Updated:** May 2026  
**Project:** LegalAI Frontend
