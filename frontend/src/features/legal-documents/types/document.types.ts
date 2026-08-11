// Types for the Legal Document feature

export interface DocumentFormValues {
  tenVanBan: string;
  soHieuVanBan: string;
  trangThaiHieuLuc: boolean;
  ngayBanHanh?: string;
  ngayHieuLuc?: string;
  nguonVanBan: string;
  noiDungVanBan?: string;
}

export interface ToastState {
  visible: boolean;
  entering: boolean;
  exiting: boolean;
}
