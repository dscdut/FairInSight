import { z } from "zod";

export const documentSchema = z
  .object({
    tenVanBan: z.string().min(5, "Tên văn bản phải có ít nhất 5 ký tự."),
    soHieuVanBan: z.string().min(1, "Bắt buộc nhập số hiệu văn bản."),
    trangThaiHieuLuc: z.boolean().default(true),
    ngayBanHanh: z.string().optional(),
    ngayHieuLuc: z.string().optional(),
    nguonVanBan: z
      .string()
      .min(1, "Trường này không được để trống.")
      .url("URL không hợp lệ."),
    noiDungVanBan: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.ngayBanHanh && data.ngayHieuLuc) {
        return new Date(data.ngayHieuLuc) >= new Date(data.ngayBanHanh);
      }
      return true;
    },
    {
      message: "Ngày hiệu lực phải sau hoặc bằng ngày ban hành.",
      path: ["ngayHieuLuc"],
    }
  );

export type DocumentSchema = z.infer<typeof documentSchema>;
