import { create } from "zustand";

import {
  type AnalysisResponse,
  type  RequestState
} from "./type";

export const useRequestStore = create<RequestState>((set) => ({
  status: "",
  response: undefined,
  error: '',

  setDefault: () => set({status: "", response: undefined, error: undefined}),
  setIdle: () => set({ status: 'idle', response: undefined, error: undefined }),
  setLoading: () => set({ status: 'loading', response: undefined, error: undefined }),
  setAnalyzed: (data: AnalysisResponse) => set({ status: 'analyzed', response: data, error: undefined }),
  setError: (error: string) => set({ status: 'error', error }),

  submitRequest: async () => {
    try {
      // fake API
      set({status: "loading", error: undefined})

      await new Promise((res) => setTimeout(res, 2000))

      const response = { 
        title: "Vụ việc mới",
        response: "AI phân tích dữ liệu" 
      }
      

      set({status: "analyzed", response: response})
    } catch (error) {
      set({ status: "error", error: "Lỗi rồi" });
    }
  },
}))