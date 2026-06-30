export interface Law {
  id: string;
  title: string;
  description: string;
}

export interface Lawyer {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
}

export interface AnalysisResponse {
  summary: string;
  category: string;
  laws: Law[];
  lawyers: Lawyer[];
}

export interface CaseInput {
  title: string;
  content: string;
}