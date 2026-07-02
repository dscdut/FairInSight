import { type ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

interface QueryProviderProps {
  children: ReactNode
}

// eslint-disable-next-line react-refresh/only-export-components
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      retry: false
    },
    mutations: {
      retry: false
    }
  }
})

// Set specific staleTime defaults (5 minutes for userInfo, 3 minutes for lawyers, templates, and laws)
queryClient.setQueryDefaults(['userInfo'], { staleTime: 5 * 60 * 1000 })
queryClient.setQueryDefaults(['lawyers'], { staleTime: 3 * 60 * 1000 })
queryClient.setQueryDefaults(['lawyerDetail'], { staleTime: 3 * 60 * 1000 })
queryClient.setQueryDefaults(['templates'], { staleTime: 3 * 60 * 1000 })
queryClient.setQueryDefaults(['templateDetail'], { staleTime: 3 * 60 * 1000 })
queryClient.setQueryDefaults(['laws'], { staleTime: 3 * 60 * 1000 })
queryClient.setQueryDefaults(['lawDetail'], { staleTime: 3 * 60 * 1000 })

export default function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
