export type RequestStatus = | "" | "idle" | "loading" | "analyzed" | "error"

export interface AnalysisRequest {
  title?: string
  content?: string
}

export interface AnalysisResponse {
  title: string;
  response?: string;
}

export interface RequestState {
  status: RequestStatus
  response?: AnalysisResponse
  error?: string;

  setDefault: () => void
  setIdle: () => void;
  setLoading: () => void;
  setAnalyzed: (data: AnalysisResponse) => void;
  setError: (error: string) => void;

  submitRequest: (data: AnalysisRequest) => Promise<void>
}
