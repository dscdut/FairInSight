// Mock data for UC-6 Legal Document List

export interface VersionHistory {
  version: string;
  savedDate: string;
  status: "Active" | "Archived";
}

export interface LegalDocument {
  id: number;
  tenVanBan: string;
  subDescription: string;
  soHieu: string;
  ngayHieuLuc: string;
  version: string;
  trangThai: "ACTIVE" | "INACTIVE";
  active: boolean;
  versions: VersionHistory[];
}

export const MOCK_DOCUMENTS: LegalDocument[] = [
  {
    id: 1,
    tenVanBan: "Luật Đất đai 2024",
    subDescription: "Ban hành bởi Quốc hội",
    soHieu: "31/2024/QH15",
    ngayHieuLuc: "01/01/2025",
    version: "V1",
    trangThai: "ACTIVE",
    active: true,
    versions: [
      { version: "V1", savedDate: "01/01/2025", status: "Active" },
    ],
  },
  {
    id: 2,
    tenVanBan: "Hợp đồng lao động mẫu",
    subDescription: "Mẫu chuẩn nội bộ",
    soHieu: "HL-2023-01",
    ngayHieuLuc: "15/10/2023",
    version: "V3",
    trangThai: "ACTIVE",
    active: true,
    versions: [
      { version: "V3", savedDate: "15/10/2023", status: "Active" },
      { version: "V2", savedDate: "01/06/2023", status: "Archived" },
      { version: "V1", savedDate: "10/01/2023", status: "Archived" },
    ],
  },
  {
    id: 3,
    tenVanBan: "Luật Đất đai 2024",
    subDescription: "Ban hành bởi Quốc hội",
    soHieu: "31/2024/QH15",
    ngayHieuLuc: "01/01/2025",
    version: "V1",
    trangThai: "ACTIVE",
    active: true,
    versions: [
      { version: "V1", savedDate: "01/01/2025", status: "Active" },
    ],
  },
  {
    id: 4,
    tenVanBan: "Hợp đồng lao động mẫu",
    subDescription: "Mẫu chuẩn nội bộ",
    soHieu: "HL-2023-01",
    ngayHieuLuc: "15/10/2023",
    version: "V3",
    trangThai: "ACTIVE",
    active: true,
    versions: [
      { version: "V3", savedDate: "15/10/2023", status: "Active" },
      { version: "V2", savedDate: "01/06/2023", status: "Archived" },
      { version: "V1", savedDate: "10/01/2023", status: "Archived" },
    ],
  },
  {
    id: 5,
    tenVanBan: "Luật Đất đai 2024",
    subDescription: "Ban hành bởi Quốc hội",
    soHieu: "31/2024/QH15",
    ngayHieuLuc: "01/01/2025",
    version: "V1",
    trangThai: "ACTIVE",
    active: true,
    versions: [
      { version: "V1", savedDate: "01/01/2025", status: "Active" },
    ],
  },
  {
    id: 6,
    tenVanBan: "Hợp đồng lao động mẫu",
    subDescription: "Mẫu chuẩn nội bộ",
    soHieu: "HL-2023-01",
    ngayHieuLuc: "15/10/2023",
    version: "V3",
    trangThai: "ACTIVE",
    active: true,
    versions: [
      { version: "V3", savedDate: "15/10/2023", status: "Active" },
      { version: "V2", savedDate: "01/06/2023", status: "Archived" },
      { version: "V1", savedDate: "10/01/2023", status: "Archived" },
    ],
  },
];
