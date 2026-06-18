export interface LicenseInfo {
  isVerified: boolean;
  licenseFileUrl: string | null;
  licenseIssuer: string;
  licenseNumber: string;
}

export interface LawyerDetail {
  averageRating: number;
  careerHistory: string;
  careerMilestones: any[];
  consultingFee: number;
  experienceYears: number;
  licenseInfo: LicenseInfo;
  name: string;
  role: string;
  specializations: any[];
}

export interface LawyerDetailResponse {
  data: {
    items: any[];
    summary: LawyerDetail;
  };
}