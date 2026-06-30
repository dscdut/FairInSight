export interface LicenseInfo {
  isVerified: boolean;
  licenseFileUrl: string | null;
  licenseIssuer: string;
  licenseNumber: string;
}

export interface LawyerDetail {
  averageRating: number;
  careerHistory: string;
  careerMilestones: string[];
  consultingFee: number;
  experienceYears: number;
  licenseInfo: LicenseInfo;
  name: string;
  role: string;
  specializations: string[];
}

export interface LawyerDetailResponse {
  data: {
    items: unknown[];
    summary: LawyerDetail;
  };
}