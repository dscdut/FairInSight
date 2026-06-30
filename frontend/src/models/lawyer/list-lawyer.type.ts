import { type VietnamCity } from '@/core/constants/vietnam-city'

export interface Lawyer {
  id: string;
  fullName: string;
  avatar?: string | null;
  careerHistory: string;
  bio: string;
  averageRating: number;
  successfulCases: number;
  specializations: string[];
  city: VietnamCity;
}

export interface Pagination {
  page?: number;
  size?: number;
  total?: number;
  totalPages?: number;
}

export interface LawyerListResponse {
  data: {
    items: Lawyer[];
    pagination: Pagination;
  };
}