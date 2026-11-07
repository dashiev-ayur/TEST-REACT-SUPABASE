import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // 30 секунд — данные считаются свежими
      retry: 1,               // один ретрай при ошибке
      refetchOnWindowFocus: false, // не дёргать запросы при возврате в окно
    },
  },
})