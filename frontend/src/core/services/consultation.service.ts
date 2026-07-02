import axiosClient from './axios-client';

export type ConsultationStage = 
  | 'PENDING'
  | 'CHATTING'
  | 'PDF_GENERATION'
  | 'PORTAL_SUBMITTING'
  | 'COMPLETED'
  | 'REVIEWED'
  | 'REJECTED';

export type SubmissionMethod = 'MANUAL' | 'PORTAL';

export interface ConsultationProcess {
  id: string;
  user_id: string;
  lawyer_id: string;
  analysis_id: string | null;
  current_stage: ConsultationStage;
  conversation_id: string | null;
  submission_method: SubmissionMethod | null;
  portal_status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  portal_feedback: string | null;
  advice_summary: string | null;
  pdf_url: string | null;
  rating: number | null;
  review_comment: string | null;
  template_id: string | null;
  template_data: any | null;
  template_status: 'SELECTED' | 'SUBMITTED' | null;
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  lawyer_details: {
    user_id: string;
    users: {
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
    };
  };
  conversations?: {
    id: string;
    messages: Array<{
      id: string;
      conversation_id: string;
      sender_id: string;
      content: string;
      created_at: string;
    }>;
  };
  analysis?: {
    id: string;
    context_summary: string | null;
    result: string | null;
  } | null;
}

export const consultationApi = {
  createConsultation: async (params: { lawyerId: string; analysisId?: string; contextSummary?: string; message?: string }): Promise<ConsultationProcess> => {
    const res = await axiosClient.post('/consultations', params);
    return res as unknown as ConsultationProcess;
  },

  getConsultation: async (id: string): Promise<ConsultationProcess> => {
    const res = await axiosClient.get(`/consultations/${id}`);
    return res as unknown as ConsultationProcess;
  },

  getConsultationByAnalysis: async (analysisId: string): Promise<ConsultationProcess | null> => {
    const res = await axiosClient.get(`/consultations/analysis/${analysisId}`);
    return res as unknown as (ConsultationProcess | null);
  },

  updateStage: async (id: string, stage: ConsultationStage): Promise<ConsultationProcess> => {
    const res = await axiosClient.patch(`/consultations/${id}/stage`, { stage });
    return res as unknown as ConsultationProcess;
  },

  skipStage: async (id: string, targetStage: ConsultationStage): Promise<ConsultationProcess> => {
    const res = await axiosClient.patch(`/consultations/${id}/skip`, { targetStage });
    return res as unknown as ConsultationProcess;
  },

  selectTemplate: async (id: string, templateId: string): Promise<ConsultationProcess> => {
    const res = await axiosClient.put(`/consultations/${id}/select-template`, { templateId });
    return res as unknown as ConsultationProcess;
  },

  submitTemplateData: async (id: string, templateData: any): Promise<ConsultationProcess> => {
    const res = await axiosClient.put(`/consultations/${id}/submit-template-data`, { templateData });
    return res as unknown as ConsultationProcess;
  },

  submitPdf: async (id: string, params: { adviceSummary: string; submissionMethod: SubmissionMethod }): Promise<ConsultationProcess> => {
    const res = await axiosClient.post(`/consultations/${id}/pdf`, params);
    return res as unknown as ConsultationProcess;
  },

  mockPortalCallback: async (id: string, payload?: { status: 'APPROVED' | 'REJECTED'; feedback: string }): Promise<ConsultationProcess> => {
    const res = await axiosClient.post(`/consultations/${id}/mock-portal-callback`, payload);
    return res as unknown as ConsultationProcess;
  },

  submitReview: async (id: string, params: { rating: number; reviewComment: string }): Promise<ConsultationProcess> => {
    const res = await axiosClient.post(`/consultations/${id}/review`, params);
    return res as unknown as ConsultationProcess;
  },

  sendMessage: async (id: string, content: string): Promise<any> => {
    const res = await axiosClient.post(`/consultations/${id}/messages`, { content });
    return res;
  },

  cancelConsultation: async (id: string): Promise<ConsultationProcess> => {
    const res = await axiosClient.patch(`/consultations/${id}/cancel`);
    return res as unknown as ConsultationProcess;
  },

  getConsultations: async (): Promise<ConsultationProcess[]> => {
    const res = await axiosClient.get('/consultations');
    return res as unknown as ConsultationProcess[];
  }
};
