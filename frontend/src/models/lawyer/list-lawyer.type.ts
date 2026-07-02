import { type VietnamCity } from '@/core/constants/vietnam-city'

export interface Lawyer {
  id: string;
  fullName: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  careerHistory: string | null;
  bio: string | null;
  averageRating: number;
  successfulCases: number;
  specializations: string[];
  location: string | VietnamCity;
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