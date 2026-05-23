# Frontend Architecture Learning Guide - LegalAI Project

**Một quy trình toàn diện để trở thành Senior Frontend Developer**  
_This guide walks you through building a production-grade React + TypeScript application architecture like LegalAI_

---

## 📚 Mục Lục

1. [Kiến Thức Nền Tảng Cần Có](#kiến-thức-nền-tảng)
2. [Setup Dự Án](#setup-dự-án)
3. [Các Khái Niệm Cốt Lõi](#các-khái-niệm-cốt-lõi)
4. [Kiến Trúc Tổng Thể](#kiến-trúc-tổng-thể)
5. [Các Tầng Ứng Dụng](#các-tầng-ứng-dụng)
6. [Thực Hành Từng Bước](#thực-hành-từng-bước)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Kiến Thức Nền Tảng

Trước khi bắt đầu, bạn cần nắm vững những kiến thức này:

### 1. **JavaScript/TypeScript Cơ Bản**

- ✅ ES6+ (arrow functions, destructuring, spread operator)
- ✅ Async/Await, Promises
- ✅ Type system (interfaces, types, generics)
- ✅ Decorators, enums

```typescript
// Ví dụ: TypeScript interface
interface User {
  id: string
  email: string
  role: 'admin' | 'employee' | 'user'
}

// Generic type
type ApiResponse<T> = {
  data: T
  message: string
  code: number
}
```

### 2. **React Cơ Bản**

- ✅ Functional components & hooks
- ✅ useState, useEffect, useCallback
- ✅ Context API
- ✅ Custom hooks

### 3. **HTML/CSS Advanced**

- ✅ Flexbox & CSS Grid
- ✅ CSS Variables
- ✅ Responsive design
- ✅ Tailwind CSS

### 4. **Công Cụ Lập Trình**

- ✅ Git & GitHub
- ✅ Terminal/Command Line
- ✅ npm/yarn
- ✅ VS Code

**📖 Tài liệu tham khảo:**

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🚀 Setup Dự Án

### Bước 1: Chuẩn Bị Môi Trường

```bash
# Cài đặt Node.js & npm (version 18+)
node --version
npm --version

# Tạo dự án React + TypeScript + Vite
npm create vite@latest my-app -- --template react-ts
cd my-app
```

### Bước 2: Cấu Hình TypeScript

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "strict": true,
    "target": "ES2020",
    "jsx": "react-jsx"
  }
}
```

### Bước 3: Cài Đặt Dependencies Chính

```bash
npm install react-router-dom @tanstack/react-query axios zod zustand
npm install -D tailwindcss postcss autoprefixer eslint typescript prettier
npm install @hookform/resolvers react-hook-form framer-motion i18next
```

### Bước 4: Cấu Hình Vite

```typescript
// vite.config.ts
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: 4000 },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

---

## 🧠 Các Khái Niệm Cốt Lõi

### 1. **Path Alias (@/)**

Cho phép import từ root thay vì `../../components/Button`

```typescript
// ❌ Tránh
import Button from '../../../components/ui/Button'

// ✅ Tốt
import { Button } from '@/components/ui/button'
```

### 2. **TypeScript - Type Safety**

Giảm bugs bằng cách catch lỗi tại compile time

```typescript
// Services với type-safety
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
}

const login = (data: LoginRequest): Promise<LoginResponse> => {
  // IDE sẽ báo lỗi nếu sai type
}
```

### 3. **React Hooks - Logic Reusability**

Chia sẻ stateful logic giữa các components

```typescript
// Custom hook
export const useAuthentication = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (credentials) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(credentials)
      setUser(response.data.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { user, isLoading, login }
}
```

### 4. **Zod - Runtime Validation**

Validate data từ API hoặc form

```typescript
import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự')
})

type LoginForm = z.infer<typeof LoginSchema>
```

### 5. **React Query (TanStack Query)**

Quản lý server state hiệu quả

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetchUsers(),
  staleTime: 5 * 60 * 1000 // cache 5 phút
})
```

### 6. **Zustand - State Management**

Lightweight alternative to Redux

```typescript
import { create } from 'zustand'

interface AuthStore {
  user: User | null
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
}))
```

---

## 🏗️ Kiến Trúc Tổng Thể

### Sơ Đồ Tổng Quan

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Components, Pages, Layouts)           │
└─────────────────────────────────────────┘
           ↓         ↓         ↓
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│  (Hooks, Services, State Management)    │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│  (API Services, Local Storage)          │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│         External Services               │
│  (Backend API, Third-party APIs)        │
└─────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── app/                       # App configuration & providers
│   ├── layout/               # Layouts (main, client)
│   └── providers/            # React context providers
├── components/               # Reusable UI components
│   ├── ui/                   # Base components (Button, Input, etc.)
│   ├── auth/                 # Auth-specific components
│   ├── header-nav/           # Navigation components
│   └── index.ts              # Barrel exports
├── core/                      # Core business logic
│   ├── configs/              # App configuration
│   ├── constants/            # Constants (routes, enums)
│   ├── helpers/              # Utility functions
│   ├── lib/                  # Third-party library setup
│   ├── services/             # API service layer
│   ├── shared/               # Shared utilities (storage, etc.)
│   ├── store/                # Zustand stores
│   └── zod/                  # Validation schemas
├── hooks/                     # Custom React hooks
│   ├── auth/                 # Auth hooks
│   ├── routes/               # Routing hooks
│   └── tanstack-query/       # React Query hooks
├── pages/                     # Page components
│   ├── login/                # Login page
│   ├── register/             # Register page
│   └── admin/                # Admin pages
├── models/                    # Type definitions & interfaces
│   ├── interface/            # API interfaces
│   └── types/                # General types
├── styles/                    # Global styles
│   ├── global.css            # Global styles
│   ├── theme.css             # Theme configuration
│   └── variant/              # Animation variants
├── locales/                   # i18n translations
│   ├── en/                   # English
│   └── vi/                   # Vietnamese
└── main.tsx                   # App entry point
```

---

## 🔄 Các Tầng Ứng Dụng

### **Tầng 1: Presentation Layer**

Hiển thị UI và xử lý user interactions

#### Ví dụ: Login Component

```typescript
// src/pages/login/Login.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginSchema } from '@/core/zod'
import { useLoginAuth } from '@/hooks/tanstack-query/auth/use-query-auth'
import { Form, FormField } from '@/components/ui/form'
import { Button } from '@/components/ui/button'

export default function Login() {
  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const { mutate: login, isPending } = useLoginAuth()

  const onSubmit = (data) => {
    login(data) // Call API through hook
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <input type="email" {...field} />
          )}
        />
        <Button type="submit" loading={isPending}>
          Đăng nhập
        </Button>
      </form>
    </Form>
  )
}
```

### **Tầng 2: Business Logic Layer**

Xử lý logic, state, và side effects

#### A. Custom Hooks (Business Logic)

```typescript
// src/hooks/tanstack-query/auth/use-query-auth.ts
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/core/services/auth.service'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { setToken, setUserToLS } from '@/core/shared/storage'

export const useLoginAuth = () => {
  const navigate = useNavigate()
  const { loginSuccess } = useAuthStore()

  return useMutation({
    mutationFn: (data) => authApi.login(data),
    onSuccess: (response) => {
      const { access_token, refresh_token, user } = response.data
      setToken(access_token, refresh_token)
      setUserToLS(user)
      loginSuccess(user)
      navigate('/dashboard')
    },
    onError: (error) => {
      console.error('Login failed:', error)
    }
  })
}
```

#### B. Zustand Store (State Management)

```typescript
// src/core/store/features/auth/authStore.ts
import { create } from 'zustand'
import { User } from '@/models/interface/auth.interface'

interface AuthStore {
  user: User | null
  isLoading: boolean
  loginStart: () => void
  loginSuccess: (user: User) => void
  loginFailure: (error: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,

  loginStart: () => set({ isLoading: true }),
  loginSuccess: (user) => set({ user, isLoading: false }),
  loginFailure: () => set({ isLoading: false }),
  logout: () => set({ user: null })
}))
```

#### C. Form Validation (Zod)

```typescript
// src/core/zod/login.zod.ts
import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự')
})

export type LoginFormData = z.infer<typeof LoginSchema>
```

### **Tầng 3: Data Access Layer**

Gọi API và quản lý data từ backend

#### A. API Service

```typescript
// src/core/services/auth.service.ts
import { AxiosInstance } from 'axios'
import axiosClient from './axios-client'
import { LoginRequest, LoginResponse, RegisterRequest } from '@/models/interface/auth.interface'

export type AuthApi = {
  login: (data: LoginRequest) => Promise<{ data: LoginResponse }>
  register: (data: RegisterRequest) => Promise<any>
  refreshToken: (token: string) => Promise<any>
}

export const createAuthApi = (client: AxiosInstance): AuthApi => ({
  login(data) {
    return client.post('/auth/login', data)
  },
  register(data) {
    return client.post('/auth/register', data)
  },
  refreshToken(token) {
    return client.post('/auth/refresh-token', { refresh_token: token })
  }
})

export const authApi = createAuthApi(axiosClient)
```

#### B. Axios Client (HTTP Interceptors)

```typescript
// src/core/services/axios-client.ts
import axios from 'axios'
import config from '@/core/configs/env'
import { getAccessTokenFromLS, setAccessTokenToLS } from '@/core/shared/storage'

const axiosClient = axios.create({
  baseURL: config.baseUrl,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor: Add token
axiosClient.interceptors.request.use((config) => {
  const token = getAccessTokenFromLS()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: Handle 401, refresh token
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
      const newToken = await refreshAccessToken()
      setAccessTokenToLS(newToken)
      return axiosClient(error.config)
    }
    return Promise.reject(error)
  }
)

export default axiosClient
```

#### C. Local Storage Helpers

```typescript
// src/core/shared/storage.ts
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user'

export const setToken = (access: string, refresh: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export const getAccessTokenFromLS = () => localStorage.getItem(ACCESS_TOKEN_KEY) || ''

export const getRefreshTokenFromLS = () => localStorage.getItem(REFRESH_TOKEN_KEY) || ''

export const clearLS = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
```

### **Tầng 4: Components (UI)**

Reusable, composable UI components

#### A. Base Components (shadcn/ui pattern)

```typescript
// src/components/ui/button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/core/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary-dark',
        outline: 'border border-primary text-primary hover:bg-primary/10',
        ghost: 'text-primary hover:bg-primary/10'
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Loading...' : props.children}
    </button>
  )
)

Button.displayName = 'Button'
```

#### B. Compound Components

```typescript
// src/components/ui/form.tsx
export function Form({ children, ...props }) {
  return <form {...props}>{children}</form>
}

export function FormField({ name, control, render }) {
  // React Hook Form integration
  return <FieldComponent name={name} control={control} render={render} />
}

export function FormItem({ children }) {
  return <div className="space-y-2">{children}</div>
}

export function FormLabel({ children }) {
  return <label className="font-medium text-sm">{children}</label>
}

export function FormControl({ children }) {
  return <div className="mt-1">{children}</div>
}

export function FormMessage({ message }) {
  return <span className="text-sm text-red-500">{message}</span>
}
```

---

## 📝 Thực Hành Từng Bước

### Project 1: Xây Dựng Login Flow (2-3 giờ)

#### Bước 1.1: Tạo Type Definitions

```typescript
// src/models/interface/auth.interface.ts
export interface LoginRequest {
  email: string
  password: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee' | 'user'
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
}
```

#### Bước 1.2: Tạo Validation Schema

```typescript
// src/core/zod/login.zod.ts
import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Tối thiểu 6 ký tự')
})
```

#### Bước 1.3: Tạo API Service

```typescript
// src/core/services/auth.service.ts
export const createAuthApi = (client: AxiosInstance) => ({
  login: (data: LoginRequest) => client.post('/auth/login', data),
  register: (data) => client.post('/auth/register', data)
  // ...
})
```

#### Bước 1.4: Tạo Custom Hook

```typescript
// src/hooks/tanstack-query/auth/use-query-auth.ts
export const useLoginAuth = () => {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data) => authApi.login(data),
    onSuccess: (response) => {
      setToken(response.data.access_token, response.data.refresh_token)
      navigate('/dashboard')
    }
  })
}
```

#### Bước 1.5: Tạo Login Component

```typescript
// src/pages/login/Login.tsx
export default function Login() {
  const form = useForm({
    resolver: zodResolver(LoginSchema)
  })
  const { mutate: login } = useLoginAuth()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => login(data))}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

### Project 2: Xây Dựng Protected Routes (1-2 giờ)

```typescript
// src/components/auth/protected-route.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { getAccessTokenFromLS } from '@/core/shared/storage'

interface ProtectedRouteProps {
  redirectPath?: string
}

export default function ProtectedRoute({
  redirectPath = '/login'
}: ProtectedRouteProps) {
  const token = getAccessTokenFromLS()

  if (!token) {
    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}
```

```typescript
// src/hooks/routes/use-router-element.tsx
export default function useRoutesElements() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute redirectPath="/login" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
```

### Project 3: Xây Dựng Data Fetching (1-2 giờ)

```typescript
// src/hooks/tanstack-query/users/use-query-users.ts
import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/core/services/user.service'

export const useGetUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000 // 10 phút
  })
}

export const useGetUserById = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userApi.getUserById(id),
    enabled: !!id
  })
}
```

```typescript
// src/pages/users/Users.tsx
export default function Users() {
  const { data: users, isLoading, error } = useGetUsers()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {users?.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

### Project 4: Xây Dựng State Management (1-2 giờ)

```typescript
// src/core/store/features/auth/authStore.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  isLoading: boolean
  actions: {
    setUser: (user: User | null) => void
    setLoading: (loading: boolean) => void
    logout: () => void
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  actions: {
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ isLoading: loading }),
    logout: () => set({ user: null })
  }
}))
```

### Project 5: Xây Dựng Themed Components (2-3 giờ)

```typescript
// src/styles/theme.css
:root {
  --background-primary: #ffffff;
  --background-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}

[data-theme='dark'] {
  --background-primary: #1a1a1a;
  --background-secondary: #2d2d2d;
  --text-primary: #ffffff;
}
```

---

## ✨ Best Practices

### 1. **File Organization**

```
✅ Good:
src/
  components/
    ui/
      button/
        Button.tsx
        button.test.tsx
        index.ts

❌ Bad:
src/
  Button.tsx
  ButtonComponent.tsx
  button-component.tsx
```

### 2. **Naming Conventions**

```typescript
// Components: PascalCase
function UserProfile() {}
export default UserProfile

// Hooks: camelCase with 'use' prefix
export const useAuthentication = () => {}
export const useLocalStorage = (key: string) => {}

// Constants: UPPER_SNAKE_CASE
export const API_TIMEOUT = 30000
export const MAX_FILE_SIZE = 1024 * 1024 * 5

// Types/Interfaces: PascalCase with suffix
interface UserResponse {}
type AuthToken = string
```

### 3. **Import Organization**

```typescript
// 1. React & external libraries
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// 2. Internal imports from core
import { authApi } from '@/core/services/auth.service'
import { LoginSchema } from '@/core/zod'

// 3. Components
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'

// 4. Hooks
import { useLoginAuth } from '@/hooks/tanstack-query/auth/use-query-auth'

// 5. Types/Models
import { type LoginRequest } from '@/models/interface/auth.interface'

// 6. Styles
import styles from './Login.module.css'
```

### 4. **Error Handling**

```typescript
// ❌ Bad
try {
  const response = await authApi.login(data)
} catch (error) {
  console.log(error)
}

// ✅ Good
try {
  const response = await authApi.login(data)
} catch (error) {
  if (error instanceof AxiosError) {
    handleAxiosError(error)
  } else if (error instanceof Error) {
    handleGenericError(error)
  }
}
```

### 5. **Type Safety**

```typescript
// ❌ Avoid 'any'
function handleUser(user: any) {
  console.log(user.name)
}

// ✅ Use proper types
interface User {
  id: string
  name: string
  email: string
}

function handleUser(user: User) {
  console.log(user.name)
}
```

### 6. **Reusable Hooks**

```typescript
// ✅ Good: Generic hook that returns loading/error/data
export const useAsync = <T>(asyncFunction: () => Promise<T>, immediate = true) => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [value, setValue] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    setStatus('pending')
    try {
      const response = await asyncFunction()
      setValue(response)
      setStatus('success')
      return response
    } catch (err) {
      setError(err as Error)
      setStatus('error')
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) execute()
  }, [execute, immediate])

  return { execute, status, value, error }
}
```

### 7. **Component Best Practices**

```typescript
// ✅ Good component structure
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }))}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? <Spinner /> : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

---

## 🔧 Configuration Files Explained

### 1. **tsconfig.json** - TypeScript Configuration

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }, // Path alias
    "strict": true, // Strict type checking
    "jsx": "react-jsx", // JSX transform
    "module": "ESNext",
    "target": "ES2020"
  }
}
```

### 2. **vite.config.ts** - Build Configuration

```typescript
export default defineConfig({
  server: {
    port: 4000,                    // Dev server port
    open: true                     // Auto-open browser
  },
  plugins: [react()],              // React plugin
  resolve: {
    alias: { '@': path.resolve(...) }  // Path alias
  }
})
```

### 3. **tailwind.config.js** - Tailwind Configuration

```javascript
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)', // CSS variable
        background: 'var(--background-primary)'
      }
    }
  }
}
```

### 4. **.eslintrc.js** - Code Quality

```javascript
export default [
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/order': ['error', { groups: [...] }],
      'unused-imports/no-unused-imports': 'error'
    }
  }
]
```

---

## 📦 Dependency Explanation

| Package                 | Purpose                 | When to Use            |
| ----------------------- | ----------------------- | ---------------------- |
| `react-router-dom`      | Client-side routing     | Multi-page apps        |
| `@tanstack/react-query` | Server state management | Fetching, caching data |
| `axios`                 | HTTP client             | API calls              |
| `zod`                   | Runtime validation      | Form/API validation    |
| `zustand`               | State management        | Global app state       |
| `react-hook-form`       | Form management         | Complex forms          |
| `framer-motion`         | Animations              | UI animations          |
| `tailwindcss`           | Utility CSS             | Styling                |
| `i18next`               | Internationalization    | Multi-language support |

---

## 🐛 Troubleshooting

### Issue 1: Path Alias Not Working

```bash
# Make sure you have:
# 1. vite.config.ts with alias
# 2. tsconfig.json with paths
# 3. Restart dev server

npm run dev
```

### Issue 2: Token Not Being Sent in Requests

```typescript
// Check axios interceptor
axiosClient.interceptors.request.use((config) => {
  const token = getAccessTokenFromLS()
  console.log('Token:', token) // Debug
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Issue 3: Components Not Re-rendering on State Change

```typescript
// Use callback in Zustand
const user = useAuthStore((state) => state.user)
// NOT
const store = useAuthStore()
store.user // Won't subscribe to changes
```

### Issue 4: Infinite Loop in useEffect

```typescript
// ❌ Bad
useEffect(() => {
  fetchData()
}, [fetchData]) // fetchData is recreated every render

// ✅ Good
const fetchData = useCallback(() => {
  // ...
}, [])

useEffect(() => {
  fetchData()
}, [fetchData])
```

---

## 📊 Learning Timeline

### **Week 1: Foundation**

- Setup project (Day 1-2)
- TypeScript basics (Day 3-4)
- React hooks deep dive (Day 5)

### **Week 2: Core Architecture**

- Create API services (Day 1-2)
- Setup Zod validation (Day 3)
- Create custom hooks (Day 4-5)

### **Week 3: UI Layer**

- Build base components (Day 1-3)
- Theme configuration (Day 4)
- Form integration (Day 5)

### **Week 4: Complete Features**

- Login flow (Day 1-2)
- Protected routes (Day 3)
- Data fetching & caching (Day 4-5)

### **Week 5: Advanced**

- State management with Zustand (Day 1-2)
- Error handling (Day 3)
- Testing components (Day 4-5)

---

## 🎓 Resources

### Official Documentation

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod Documentation](https://zod.dev)

### YouTube Channels

- Web Dev Simplified
- Traversy Media
- Fireship
- freeCodeCamp

### Practice Platforms

- LeetCode (JavaScript)
- CodeWars
- Frontend Mentor
- DevProjects

---

## 🚀 Next Steps After Completing This Guide

1. **Contribute to Open Source** - Apply your knowledge to real projects
2. **Build Personal Projects** - Create 3-5 projects from scratch
3. **Learn Testing** - Jest, React Testing Library, Cypress
4. **Study Advanced Topics**:
   - Performance optimization
   - Accessibility (a11y)
   - PWA development
   - Next.js
5. **Explore Backend** - Node.js, databases to understand full-stack

---

## 📝 Notes

- Keep your components small and focused (single responsibility)
- Always use TypeScript strict mode
- Document complex logic with comments
- Test your components regularly
- Follow the DRY principle (Don't Repeat Yourself)
- Use meaningful variable and function names

---

**Chúc bạn học tập hiệu quả! 🎉**

_Tài liệu này được tạo dựa trên kiến trúc thực tế của dự án LegalAI._
