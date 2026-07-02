import { type UserStatus, type UserRole } from "../user/types";

type LawyerStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface LicenseInfo {
  isVerified: boolean;
  licenseFileUrl: string | null;
  licenseIssuer: string;
  licenseNumber: string;
}

export interface LawyerDetail {
  id: string;
  email: string;
  phone: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
  name: string;
  roleName: UserRole;
  bio: string | null;
  averageRating: number;
  careerHistory: string | null;
  careerMilestones: string[];
  consultingFee: number;
  experienceYears: number;
  successfulCases: number;
  lawyerStatus: LawyerStatus;
  status: UserStatus;
  licenseInfo: LicenseInfo;
  specializations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LawyerDetailResponse {
  data: {
    items: unknown[];
    summary: LawyerDetail;
  };
}