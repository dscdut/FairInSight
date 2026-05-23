# Frontend Architecture - Practical Exercises

## 🎯 Hands-On Learning Through Building

Tài liệu này chứa 10 bài tập thực hành để bạn xây dựng kỹ năng từ cơ bản đến nâng cao.

---

## **Exercise 1: Project Setup (30 minutes)**

### Mục tiêu:

- Tạo React + TypeScript project
- Cấu hình Vite, TypeScript, Tailwind
- Setup đầu tiên

### Các bước thực hiện:

**1.1: Tạo dự án**

```bash
npm create vite@latest my-legal-ai -- --template react-ts
cd my-legal-ai
npm install
```

**1.2: Cài đặt dependencies**

```bash
npm install react-router-dom @tanstack/react-query axios zod zustand
npm install @hookform/resolvers react-hook-form framer-motion
npm install -D tailwindcss postcss autoprefixer
npm install -D eslint prettier typescript
```

**1.3: Setup Tailwind**

```bash
npx tailwindcss init -p
```

Cập nhật `tailwind.config.js`:

```js
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#f5f5f5'
      }
    }
  }
}
```

**1.4: Cập nhật `src/styles/global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #6366f1;
  --background-primary: #ffffff;
  --text-primary: #1a1a1a;
}
```

**1.5: Cấu hình Path Alias**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

`vite.config.ts`:

```typescript
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

**1.6: Kiểm tra**

```bash
npm run dev
# Should start on http://localhost:5173
```

✅ **Hoàn thành khi:** Dev server chạy được và không có lỗi

---

## **Exercise 2: Type Definitions & Models (45 minutes)**

### Mục tiêu:

- Tạo type definitions cho toàn dự án
- Hiểu cách organize types

### Các bước thực hiện:

**2.1: Tạo thư mục cấu trúc**

```bash
mkdir -p src/models/interface src/models/types
mkdir -p src/core/{configs,constants,helpers,services,shared,store,zod}
mkdir -p src/components/ui src/hooks src/pages
```

**2.2: Tạo `src/models/interface/auth.interface.ts`**

```typescript
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword: string
  name: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee' | 'user'
  createdAt: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface ApiError {
  code: string
  message: string
  statusCode: number
}
```

**2.3: Tạo `src/models/interface/common.interface.ts`**

```typescript
export interface ApiResponse<T> {
  data: T
  message: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

**2.4: Tạo `src/core/configs/consts.ts`**

```typescript
export const ROLE_ADMIN = 'admin'
export const ROLE_EMPLOYEE = 'employee'
export const ROLE_USER = 'user'

export const numberConstants = {
  ZERO: 0,
  ONE: 1,
  TWO: 2,
  SIX: 6
}

export const REMEMBER_ME = 'rememberMe'
export const PASSWORD_TYPE = 'password'
export const TEXT_TYPE = 'text'

export const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh-token']
```

**2.5: Tạo `src/core/constants/path.ts`**

```typescript
export const ROUTE = {
  HOME: '/',

  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    VERIFY_ACCOUNT_EMAIL: '/verify-account-email',
    RESET_PASSWORD: '/reset-password'
  },

  PROFILE: {
    ROOT: '/profile',
    EDIT: '/profile/edit'
  },

  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users'
  },

  NOT_FOUND: '*'
}
```

**2.6: Tạo `src/core/configs/env.ts`**

```typescript
const config = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  maxSizeUploadAvatar: 1048576 // 1MB
}

export default config
```

**2.7: Tạo `.env`**

```
VITE_API_URL=http://localhost:3000/api
```

✅ **Hoàn thành khi:** Không có TypeScript errors

---

## **Exercise 3: Validation Schema with Zod (30 minutes)**

### Mục tiêu:

- Tạo validation schemas
- Validate form data at runtime

### Các bước thực hiện:

**3.1: Tạo `src/core/zod/login.zod.ts`**

```typescript
import { z } from 'zod'
import { numberConstants } from '@/core/configs/consts'

export const LoginSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),

  password: z.string().min(numberConstants.SIX, 'Mật khẩu tối thiểu 6 ký tự')
})

export type LoginFormType = z.infer<typeof LoginSchema>
```

**3.2: Tạo `src/core/zod/register.zod.ts`**

```typescript
import { z } from 'zod'
import { numberConstants } from '@/core/configs/consts'

export const RegisterSchema = z
  .object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(numberConstants.SIX, 'Tối thiểu 6 ký tự'),
    confirmPassword: z.string(),
    name: z.string().min(2, 'Tên tối thiểu 2 ký tự')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword']
  })

export type RegisterFormType = z.infer<typeof RegisterSchema>
```

**3.3: Tạo `src/core/zod/index.ts`** (Barrel export)

```typescript
export { LoginSchema, type LoginFormType } from './login.zod'
export { RegisterSchema, type RegisterFormType } from './register.zod'
```

**3.4: Test thử**

```typescript
import { LoginSchema } from '@/core/zod'

// Trong browser console hoặc test file
const result = LoginSchema.parse({
  email: 'test@example.com',
  password: '123456'
})
console.log(result) // ✓ Valid

try {
  LoginSchema.parse({ email: 'invalid', password: '123' })
} catch (e) {
  console.log(e.errors) // ✗ Invalid
}
```

✅ **Hoàn thành khi:** Validation hoạt động đúng

---

## **Exercise 4: API Service Layer (45 minutes)**

### Mục tiêu:

- Tạo HTTP client với Axios
- Implement API services
- Xử lý token management

### Các bước thực hiện:

**4.1: Tạo `src/core/shared/storage.ts`**

```typescript
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user'

export const setToken = (access: string, refresh: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export const getAccessTokenFromLS = () => localStorage.getItem(ACCESS_TOKEN_KEY) || ''

export const getRefreshTokenFromLS = () => localStorage.getItem(REFRESH_TOKEN_KEY) || ''

export const setUserToLS = (user: any) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getUserFromLS = () => {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export const clearLS = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
```

**4.2: Tạo `src/core/services/axios-client.ts`**

```typescript
import axios, { AxiosInstance } from 'axios'
import config from '@/core/configs/env'
import { getAccessTokenFromLS, setAccessTokenToLS } from '@/core/shared/storage'

const axiosClient: AxiosInstance = axios.create({
  baseURL: config.baseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessTokenFromLS()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // Handle 401 - Token expired
    if (error.response?.status === 401) {
      console.log('Token expired')
      // TODO: Implement token refresh logic
    }
    return Promise.reject(error)
  }
)

export default axiosClient
```

**4.3: Tạo `src/core/services/auth.service.ts`**

```typescript
import { AxiosInstance } from 'axios'
import axiosClient from './axios-client'
import { LoginRequest, LoginResponse, RegisterRequest } from '@/models/interface/auth.interface'

export type AuthApi = {
  login: (data: LoginRequest) => Promise<{ data: LoginResponse }>
  register: (data: RegisterRequest) => Promise<any>
  logout: (refreshToken: string) => Promise<void>
}

export const createAuthApi = (client: AxiosInstance): AuthApi => ({
  login(data) {
    return client.post('/auth/login', data)
  },

  register(data) {
    return client.post('/auth/register', data)
  },

  logout(refreshToken) {
    return client.post('/auth/logout', { refresh_token: refreshToken })
  }
})

export const authApi = createAuthApi(axiosClient)
```

**4.4: Test API calls**

```typescript
// src/main.tsx hoặc dev console
import { authApi } from '@/core/services/auth.service'

// Test login
authApi
  .login({
    email: 'test@example.com',
    password: '123456'
  })
  .then((res) => console.log('Success:', res))
  .catch((err) => console.log('Error:', err))
```

✅ **Hoàn thành khi:** API calls hoạt động (xem network tab)

---

## **Exercise 5: State Management with Zustand (30 minutes)**

### Mục tiêu:

- Tạo Zustand stores
- Quản lý authentication state

### Các bước thực hiện:

**5.1: Tạo `src/core/store/features/auth/authStore.ts`**

```typescript
import { create } from 'zustand'
import { User } from '@/models/interface/auth.interface'

interface AuthState {
  // State
  user: User | null
  isLoading: boolean
  error: string | null

  // Actions
  loginStart: () => void
  loginSuccess: (user: User) => void
  loginFailure: (error: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  loginStart: () => set({ isLoading: true, error: null }),

  loginSuccess: (user) =>
    set({
      user,
      isLoading: false,
      error: null
    }),

  loginFailure: (error) =>
    set({
      isLoading: false,
      error
    }),

  logout: () =>
    set({
      user: null,
      isLoading: false,
      error: null
    })
}))
```

**5.2: Test Store**

```typescript
// Dev console
import { useAuthStore } from '@/core/store/features/auth/authStore'

const store = useAuthStore()

// Simulate login
store.loginStart()
store.loginSuccess({
  id: '1',
  name: 'John',
  email: 'john@example.com',
  role: 'user',
  createdAt: new Date().toISOString()
})

// Check state
console.log(useAuthStore.getState().user)

// Simulate logout
store.logout()
console.log(useAuthStore.getState().user) // null
```

✅ **Hoàn thành khi:** Store state changes work correctly

---

## **Exercise 6: Custom Hooks (45 minutes)**

### Mục tiêu:

- Tạo custom hooks cho business logic
- Tương tác với API & state

### Các bước thực hiện:

**6.1: Tạo `src/hooks/auth/use-auth.ts`**

```typescript
import { useEffect, useState } from 'react'
import { User } from '@/models/interface/auth.interface'
import { getUserFromLS } from '@/core/shared/storage'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = getUserFromLS()
    setUser(savedUser)
    setIsLoading(false)
  }, [])

  return { user, isLoading, isAuthenticated: !!user }
}
```

**6.2: Setup React Query (before Exercise 6.3)**

```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
```

**6.3: Tạo `src/hooks/tanstack-query/auth/use-query-auth.ts`**

```typescript
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/core/services/auth.service'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { setToken, setUserToLS } from '@/core/shared/storage'
import { LoginFormType } from '@/core/zod'

export const useLoginAuth = () => {
  const navigate = useNavigate()
  const { loginStart, loginSuccess, loginFailure } = useAuthStore()

  return useMutation({
    mutationFn: (data: LoginFormType) => authApi.login(data),

    onMutate: () => loginStart(),

    onSuccess: (response) => {
      const { access_token, refresh_token, user } = response.data

      // Store tokens
      setToken(access_token, refresh_token)
      setUserToLS(user)

      // Update store
      loginSuccess(user)

      // Redirect
      navigate('/dashboard')
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed'
      loginFailure(message)
    }
  })
}
```

**6.4: Test Custom Hooks**

```typescript
// Trong một component
import { useLoginAuth } from '@/hooks/tanstack-query/auth/use-query-auth'

export default function TestLogin() {
  const { mutate: login, isPending } = useLoginAuth()

  const handleLogin = () => {
    login({
      email: 'test@example.com',
      password: '123456'
    })
  }

  return (
    <button onClick={handleLogin} disabled={isPending}>
      {isPending ? 'Logging in...' : 'Login'}
    </button>
  )
}
```

✅ **Hoàn thành khi:** Hook successfully calls API and updates state

---

## **Exercise 7: Base UI Components (60 minutes)**

### Mục tiêu:

- Tạo reusable UI components
- Dùng Tailwind CSS

### Các bước thực hiện:

**7.1: Tạo `src/components/ui/button.tsx`**

```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading,
    children,
    ...props
  }, ref) => {
    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-primary/90',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      ghost: 'bg-transparent text-primary hover:bg-primary/10'
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    }

    return (
      <button
        ref={ref}
        disabled={loading || props.disabled}
        className={`
          inline-flex items-center justify-center rounded-md font-medium
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
        `}
        {...props}
      >
        {loading ? '...' : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

**7.2: Tạo `src/components/ui/input.tsx`**

```typescript
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => (
    <input
      ref={ref}
      className={`
        w-full px-4 py-2 border border-gray-300 rounded-md
        focus:outline-none focus:ring-2 focus:ring-primary/50
        disabled:bg-gray-100 disabled:cursor-not-allowed
      `}
      {...props}
    />
  )
)

Input.displayName = 'Input'
```

**7.3: Tạo `src/components/ui/card.tsx`**

```typescript
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export const Card = ({ children, className = '' }: CardProps) => (
  <div className={`rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
    {children}
  </div>
)
```

**7.4: Tạo `src/components/ui/index.ts`** (Barrel export)

```typescript
export { Button } from './button'
export { Input } from './input'
export { Card } from './card'
```

**7.5: Test Components**

```typescript
// src/App.tsx
import { Button, Input, Card } from '@/components/ui'

export default function App() {
  return (
    <Card>
      <h1>Test Components</h1>
      <Input placeholder="Enter text..." />
      <Button>Click me</Button>
      <Button variant="secondary">Secondary</Button>
      <Button size="lg">Large Button</Button>
    </Card>
  )
}
```

✅ **Hoàn thành khi:** Components render correctly with Tailwind styles

---

## **Exercise 8: Login Page Complete (90 minutes)**

### Mục tiêu:

- Xây dựng hoàn chỉnh trang Login
- Tích hợp tất cả layers

### Các bước thực hiện:

**8.1: Install React Hook Form**

```bash
npm install react-hook-form @hookform/resolvers
```

**8.2: Tạo Form Components**

`src/components/ui/form.tsx`:

```typescript
import { ReactNode } from 'react'
import { FieldValues, UseFormReturn } from 'react-hook-form'

export const Form = ({ children, ...props }: any) => (
  <form {...props}>{children}</form>
)

export const FormField = ({ render }: any) => render({})

export const FormItem = ({ children }: { children: ReactNode }) => (
  <div className="space-y-1">{children}</div>
)

export const FormLabel = ({ children }: { children: ReactNode }) => (
  <label className="block text-sm font-medium text-gray-900">
    {children}
  </label>
)

export const FormControl = ({ children }: { children: ReactNode }) => (
  <div className="mt-1">{children}</div>
)

export const FormMessage = ({ message }: { message?: string }) => (
  message && <span className="text-sm text-red-500">{message}</span>
)
```

**8.3: Tạo `src/pages/login/Login.tsx`**

```typescript
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Button, Input, Card } from '@/components/ui'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { LoginSchema } from '@/core/zod'
import { useLoginAuth } from '@/hooks/tanstack-query/auth/use-query-auth'
import { ROUTE } from '@/core/constants/path'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const { mutate: login, isPending } = useLoginAuth()

  const onSubmit = (data: any) => {
    login(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Đăng nhập</h1>
          <p className="text-gray-500 mt-2">Chào mừng trở lại</p>
        </div>

        <Form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="your@email.com"
                {...form.register('email')}
              />
            </FormControl>
            <FormMessage message={form.formState.errors.email?.message as string} />
          </FormItem>

          {/* Password Field */}
          <FormItem>
            <FormLabel>Mật khẩu</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </FormControl>
            <FormMessage message={form.formState.errors.password?.message as string} />
          </FormItem>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>

          {/* Links */}
          <div className="text-center space-y-2 text-sm text-gray-500">
            <div>
              <Link to={ROUTE.AUTH.FORGOT_PASSWORD} className="text-primary hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <div>
              Chưa có tài khoản?{' '}
              <Link to={ROUTE.AUTH.REGISTER} className="text-primary hover:underline">
                Đăng ký
              </Link>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  )
}
```

**8.4: Setup Routing**

`src/hooks/routes/use-router-element.tsx`:

```typescript
import { Routes, Route } from 'react-router-dom'
import Login from '@/pages/login/Login'
import { ROUTE } from '@/core/constants/path'

export default function useRoutesElements() {
  return (
    <Routes>
      <Route path={ROUTE.AUTH.LOGIN} element={<Login />} />
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  )
}
```

**8.5: Update `src/App.tsx`**

```typescript
import { BrowserRouter } from 'react-router-dom'
import useRoutesElements from '@/hooks/routes/use-router-element'

function App() {
  const router = useRoutesElements()

  return (
    <BrowserRouter>
      {router}
    </BrowserRouter>
  )
}

export default App
```

✅ **Hoàn thành khi:** Login page fully functional, can submit form

---

## **Exercise 9: Protected Routes (45 minutes)**

### Mục tiêu:

- Tạo protected route guard
- Redirect unauthorized users
- Check authentication state

### Các bước thực hiện:

**9.1: Tạo `src/components/auth/protected-route.tsx`**

```typescript
import { Navigate, Outlet } from 'react-router-dom'
import { getAccessTokenFromLS } from '@/core/shared/storage'
import { ROUTE } from '@/core/constants/path'

interface ProtectedRouteProps {
  redirectPath?: string
}

export default function ProtectedRoute({
  redirectPath = ROUTE.AUTH.LOGIN
}: ProtectedRouteProps) {
  const token = getAccessTokenFromLS()

  if (!token) {
    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}
```

**9.2: Update Routes with Protection**

`src/hooks/routes/use-router-element.tsx`:

```typescript
import { Routes, Route, useLocation } from 'react-router-dom'
import Login from '@/pages/login/Login'
import ProtectedRoute from '@/components/auth/protected-route'
import Dashboard from '@/pages/admin/dashboard'
import { ROUTE } from '@/core/constants/path'

export default function useRoutesElements() {
  return (
    <Routes>
      <Route path={ROUTE.AUTH.LOGIN} element={<Login />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTE.ADMIN.DASHBOARD} element={<Dashboard />} />
      </Route>

      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  )
}
```

**9.3: Create Dashboard Component**

`src/pages/admin/dashboard/index.tsx`:

```typescript
import { useAuth } from '@/hooks/auth/use-auth'
import { Card, Button } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { clearLS } from '@/core/shared/storage'
import { ROUTE } from '@/core/constants/path'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    clearLS()
    logout()
    navigate(ROUTE.AUTH.LOGIN)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name}!</p>

        <div className="mt-6 space-y-4">
          <div>
            <strong>Email:</strong> {user?.email}
          </div>
          <div>
            <strong>Role:</strong> {user?.role}
          </div>
        </div>

        <Button
          onClick={handleLogout}
          variant="secondary"
          className="mt-6"
        >
          Logout
        </Button>
      </Card>
    </div>
  )
}
```

✅ **Hoàn thành khi:** Protected routes work, can login and logout

---

## **Exercise 10: Data Fetching & Caching (60 minutes)**

### Mục tiêu:

- Fetch data từ API
- Cache with React Query
- Handle loading & errors

### Các bước thực hiện:

**10.1: Create User Service**

`src/core/services/user.service.ts`:

```typescript
import { AxiosInstance } from 'axios'
import axiosClient from './axios-client'
import { User } from '@/models/interface/auth.interface'

export type UserApi = {
  getUsers: () => Promise<{ data: User[] }>
  getUserById: (id: string) => Promise<{ data: User }>
}

export const createUserApi = (client: AxiosInstance): UserApi => ({
  getUsers() {
    return client.get('/users')
  },

  getUserById(id) {
    return client.get(`/users/${id}`)
  }
})

export const userApi = createUserApi(axiosClient)
```

**10.2: Create Custom Hooks for Data Fetching**

`src/hooks/tanstack-query/users/use-query-users.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/core/services/user.service'

export const useGetUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getUsers().then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000 // 10 min
  })
}

export const useGetUserById = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userApi.getUserById(id).then((res) => res.data),
    enabled: !!id
  })
}
```

**10.3: Create Users Page**

`src/pages/admin/users/index.tsx`:

```typescript
import { useGetUsers } from '@/hooks/tanstack-query/users/use-query-users'
import { Card, Button } from '@/components/ui'

export default function Users() {
  const { data: users, isLoading, error, refetch } = useGetUsers()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card>
          <p className="text-red-500">Error: {error.message}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Users</h1>
          <Button onClick={() => refetch()}>Refresh</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-gray-500 mt-4">
          Total: {users?.length} users
        </p>
      </Card>
    </div>
  )
}
```

**10.4: Update Routes**

`src/hooks/routes/use-router-element.tsx`:

```typescript
const Users = lazy(() => import('@/pages/admin/users'))

// In Routes...
<Route element={<ProtectedRoute />}>
  <Route path={ROUTE.ADMIN.USERS} element={<Users />} />
</Route>
```

✅ **Hoàn thành khi:** Can fetch and display users list with caching

---

## 🎓 Learning Checklist

- [ ] Exercise 1: Setup Project
- [ ] Exercise 2: Type Definitions
- [ ] Exercise 3: Validation Schema
- [ ] Exercise 4: API Service Layer
- [ ] Exercise 5: State Management
- [ ] Exercise 6: Custom Hooks
- [ ] Exercise 7: UI Components
- [ ] Exercise 8: Login Page
- [ ] Exercise 9: Protected Routes
- [ ] Exercise 10: Data Fetching

---

## 📝 Next Steps

After completing all exercises:

1. **Build Register Page** - Apply same patterns
2. **Add Error Handling** - Global error boundary
3. **Implement Animations** - Framer Motion
4. **Add Testing** - Jest + React Testing Library
5. **Deploy to Production** - Vercel, Netlify

---

**Good luck! 🚀**
