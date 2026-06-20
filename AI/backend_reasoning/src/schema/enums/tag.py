"""Enums cho hệ thống tag/taxonomy + review queue."""

from __future__ import annotations

from enum import Enum


class TagType(str, Enum):
    """Ba cấp taxonomy có kiểm soát (đi từ rộng → hẹp)."""

    DOMAIN = "domain"        # lĩnh vực (30 cố định, xem LegalDomain)
    TOPIC = "topic"          # chủ đề nhỏ (xây trên Tier A bằng LLM, admin duyệt)
    CASE_TYPE = "case_type"  # loại vụ việc (routing chat)


class LegalDomain(str, Enum):
    """30 lĩnh vực pháp luật CỐ ĐỊNH (trục nội dung, theo cách user tra cứu).

    Danh mục ĐÓNG: tag chỉ được chọn trong đây, KHÔNG bịa slug mới (trước đây LLM
    tự do → 503 slug loạn). Loại văn bản (luật/nghị định...) KHÔNG nằm đây — đã có
    ở cột doc_type. KHAC là fallback chống bịa khi không rõ lĩnh vực."""

    # Kinh tế - Kinh doanh
    DOANH_NGHIEP = "doanh_nghiep"
    DAU_TU = "dau_tu"
    THUONG_MAI = "thuong_mai"
    TAI_CHINH = "tai_chinh"
    THUE = "thue"
    CHUNG_KHOAN = "chung_khoan"
    BAO_HIEM = "bao_hiem"
    # Đất đai - Xây dựng - Môi trường
    DAT_DAI = "dat_dai"
    XAY_DUNG = "xay_dung"
    TAI_NGUYEN_MOI_TRUONG = "tai_nguyen_moi_truong"
    NONG_NGHIEP = "nong_nghiep"
    GIAO_THONG_VAN_TAI = "giao_thong_van_tai"
    NANG_LUONG = "nang_luong"
    # Dân sự - Lao động - Xã hội
    DAN_SU = "dan_su"
    HON_NHAN_GIA_DINH = "hon_nhan_gia_dinh"
    LAO_DONG = "lao_dong"
    CHINH_SACH_XA_HOI = "chinh_sach_xa_hoi"
    Y_TE = "y_te"
    GIAO_DUC = "giao_duc"
    VAN_HOA = "van_hoa"
    # Hành chính - Nhà nước - Tư pháp
    HANH_CHINH = "hanh_chinh"
    CAN_BO_CONG_CHUC = "can_bo_cong_chuc"
    HINH_SU = "hinh_su"
    TO_TUNG = "to_tung"
    AN_NINH_QUOC_PHONG = "an_ninh_quoc_phong"
    # Khoa học - Công nghiệp
    KHOA_HOC_CONG_NGHE = "khoa_hoc_cong_nghe"
    CONG_NGHIEP = "cong_nghiep"
    # Bổ sung
    DAN_TOC_TON_GIAO = "dan_toc_ton_giao"
    NGOAI_GIAO = "ngoai_giao"
    THANH_TRA = "thanh_tra"
    # Fallback
    KHAC = "khac"


class TagStatus(str, Enum):
    """Vòng đời tag — LLM KHÔNG được tạo thẳng 'active'."""

    ACTIVE = "active"      # đã duyệt, dùng được
    PENDING = "pending"    # LLM đề xuất, chờ admin duyệt
    MERGED = "merged"      # đã gộp vào tag khác


class ReviewStatus(str, Enum):
    """Trạng thái một mục trong hàng đợi review."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
