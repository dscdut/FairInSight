"""Kho tag pháp luật CHUẨN (cố định) cho POC-FairInsight.

Nguồn gốc: field `majors` của vbpl.vn (Bộ Tư pháp phân loại theo bộ-ngành) — đáng tin
hơn để LLM tự bịa (đo thực tế: LLM sinh 503 domain lộn xộn, trùng chéo). Đây là danh
mục ĐÓNG: mọi văn bản phải map về đúng 1 trong các slug dưới. LLM/khi tag chỉ được
CHỌN trong kho này, KHÔNG tự nghĩ slug mới.

Mỗi entry: slug (ascii, snake_case) → {name (hiển thị), aliases (biến thể nguồn để map)}.
Dùng cho: (1) chuẩn hoá majors nguồn vbpl khi ingest, (2) ràng buộc prompt tagging,
(3) thống nhất bảng legal_tags.
"""
from __future__ import annotations

import re
import unicodedata

# slug → (tên hiển thị, danh sách alias chữ thường không dấu để khớp majors nguồn)
LEGAL_DOMAINS: dict[str, dict] = {
    "doanh_nghiep":         {"name": "Doanh nghiệp", "kw": ["doanh nghiep", "hop tac xa", "ho kinh doanh"], "aliases": ["doanh nghiep", "kinh doanh", "doanh nghiep hop tac xa"]},
    "dau_tu":               {"name": "Đầu tư - Đấu thầu", "kw": ["dau tu", "dau thau", "ppp", "doi tac cong tu"], "aliases": ["dau tu", "dau thau", "ke hoach va dau tu", "ke hoach dau tu"]},
    "thuong_mai":           {"name": "Thương mại", "kw": ["thuong mai", "xuat nhap khau", "canh tranh", "bao ve nguoi tieu dung", "logistics"], "aliases": ["thuong mai", "xuat nhap khau", "cong thuong"]},
    "tai_chinh":            {"name": "Tài chính - Ngân hàng", "kw": ["tai chinh", "ngan sach", "ngan hang", "tien te", "ke toan", "kiem toan", "tin dung", "no cong"], "aliases": ["tai chinh", "ngan hang", "ngan hang tien te", "tin dung", "ngan sach nha nuoc", "tai san cong", "ke toan kiem toan", "kiem toan"]},
    "thue":                 {"name": "Thuế - Phí - Lệ phí", "kw": ["thue", "phi", "le phi", "hai quan"], "aliases": ["thue", "chinh sach thue", "quan ly thue phi le phi"]},
    "chung_khoan":          {"name": "Chứng khoán", "kw": ["chung khoan", "trai phieu"], "aliases": ["chung khoan"]},
    "bao_hiem":             {"name": "Bảo hiểm", "kw": ["bao hiem", "bao hiem xa hoi", "bao hiem y te", "bao hiem that nghiep"], "aliases": ["bao hiem", "bao hiem xa hoi"]},
    "dat_dai":              {"name": "Đất đai - Nhà ở", "kw": ["dat dai", "nha o", "bat dong san", "thu hoi dat", "giao dat"], "aliases": ["dat dai", "nha o", "bat dong san"]},
    "xay_dung":             {"name": "Xây dựng - Đô thị", "kw": ["xay dung", "do thi", "quy hoach"], "aliases": ["xay dung", "xay dung nha o do thi", "quy hoach"]},
    "tai_nguyen_moi_truong": {"name": "Tài nguyên - Môi trường", "kw": ["moi truong", "tai nguyen", "khoang san", "tai nguyen nuoc"], "aliases": ["tai nguyen va moi truong", "nong nghiep va moi truong", "moi truong", "tai nguyen"]},
    "nong_nghiep":          {"name": "Nông nghiệp", "kw": ["nong nghiep", "lam nghiep", "thuy san", "chan nuoi", "trong trot", "thu y"], "aliases": ["nong nghiep va phat trien nong thon", "nong nghiep", "thuy san", "lam nghiep"]},
    "giao_thong_van_tai":   {"name": "Giao thông vận tải", "kw": ["giao thong", "van tai", "duong bo", "duong sat", "hang hai", "hang khong"], "aliases": ["giao thong van tai", "giao thong", "hang hai", "duong sat", "hang khong"]},
    "nang_luong":           {"name": "Năng lượng", "kw": ["nang luong", "dien luc", "su dung dien", "tiet kiem dien", "luoi dien", "gia dien", "dau khi", "xang dau", "than khoang"], "aliases": ["nang luong", "dien luc", "dau khi"]},
    "dan_su":               {"name": "Dân sự", "kw": ["dan su", "thua ke", "hop dong", "so huu", "giao dich"], "aliases": ["dan su", "dan su kinh te"]},
    "hon_nhan_gia_dinh":    {"name": "Hôn nhân - Gia đình", "kw": ["hon nhan", "gia dinh", "ket hon", "ly hon", "nuoi con nuoi"], "aliases": ["hon nhan va gia dinh", "hon nhan gia dinh"]},
    "lao_dong":             {"name": "Lao động", "kw": ["lao dong", "tien luong", "viec lam", "an toan ve sinh lao dong", "cong doan"], "aliases": ["lao dong thuong binh va xa hoi", "lao dong"]},
    "chinh_sach_xa_hoi":    {"name": "Chính sách xã hội", "kw": ["an sinh", "nguoi co cong", "giam ngheo", "tre em", "binh dang gioi", "phong chong te nan"], "aliases": ["chinh sach xa hoi", "an sinh xa hoi", "nguoi co cong"]},
    "y_te":                 {"name": "Y tế - Dược", "kw": ["y te", "kham chua benh", "duoc", "an toan thuc pham", "dich benh"], "aliases": ["y te", "duoc"]},
    "giao_duc":             {"name": "Giáo dục - Đào tạo", "kw": ["giao duc", "dao tao", "day nghe", "hoc sinh", "sinh vien"], "aliases": ["giao duc va dao tao", "giao duc"]},
    "van_hoa":              {"name": "Văn hóa - Thể thao - Du lịch", "kw": ["van hoa", "the thao", "du lich", "di san", "bao chi", "quang cao"], "aliases": ["van hoa the thao va du lich", "van hoa va the thao", "van hoa", "van hoa thong tin", "the thao", "du lich"]},
    "hanh_chinh":           {"name": "Hành chính - Bộ máy NN", "kw": ["hanh chinh", "to chuc bo may", "chinh quyen dia phuong", "thu tuc hanh chinh"], "aliases": ["hanh chinh", "quan ly nha nuoc", "hanh chinh cong", "chinh quyen dia phuong", "noi vu", "to chuc bien che"]},
    "can_bo_cong_chuc":     {"name": "Cán bộ - Công chức - Viên chức", "kw": ["can bo", "cong chuc", "vien chuc", "thi dua khen thuong", "tien luong can bo"], "aliases": ["can bo cong chuc", "cong chuc vien chuc", "thi dua khen thuong", "to chuc can bo chinh phu", "to chuc can bo quoc hoi"]},
    "hinh_su":              {"name": "Hình sự", "kw": ["hinh su", "toi pham", "xu phat vi pham hanh chinh", "xu ly vi pham"], "aliases": ["hinh su", "xu ly vi pham hanh chinh va theo doi thi hanh phap luat"]},
    "to_tung":              {"name": "Tố tụng - Thi hành án", "kw": ["to tung", "thi hanh an", "bo tro tu phap", "tro giup phap ly", "hanh nghe luat su", "cong chung", "trong tai thuong mai"], "aliases": ["to tung", "thi hanh an dan su", "bo tro tu phap", "tro giup phap ly", "toa an", "kiem sat", "tu phap", "nganh tu phap"]},
    "an_ninh_quoc_phong":   {"name": "An ninh - Quốc phòng", "kw": ["quoc phong", "an ninh", "quan su", "cong an", "trat tu", "bien phong", "dan quan"], "aliases": ["quoc phong", "an ninh quoc gia", "cong an", "co yeu", "bi mat nha nuoc", "quoc phong an ninh va trat tu an toan xa hoi"]},
    "khoa_hoc_cong_nghe":   {"name": "Khoa học - Công nghệ - CNTT", "kw": ["khoa hoc", "cong nghe", "so huu tri tue", "cong nghe thong tin", "giao dich dien tu", "dien tu", "an ninh mang", "vien thong", "buu chinh", "chuyen doi so", "du lieu"], "aliases": ["khoa hoc va cong nghe", "khoa hoc cong nghe", "thong tin va truyen thong", "buu chinh vien thong", "cong nghe thong tin"]},
    "cong_nghiep":          {"name": "Công nghiệp - Sản xuất", "kw": ["cong nghiep", "che bien", "che tao", "san xuat", "hoa chat"], "aliases": ["cong nghiep", "cong thuong"]},
    "dan_toc_ton_giao":     {"name": "Dân tộc - Tôn giáo", "kw": ["dan toc", "ton giao", "tin nguong"], "aliases": ["dan toc", "dan toc va ton giao", "ton giao"]},
    "ngoai_giao":           {"name": "Ngoại giao - Điều ước quốc tế", "kw": ["ngoai giao", "dieu uoc quoc te", "lanh su", "quoc tich"], "aliases": ["ngoai giao", "quoc tich"]},
    "thanh_tra":            {"name": "Thanh tra - Khiếu nại - PCTN", "kw": ["thanh tra", "khieu nai", "to cao", "phong chong tham nhung", "tiep cong dan"], "aliases": ["thanh tra", "khieu nai to cao", "phong chong tham nhung"]},
    "khac":                 {"name": "Khác / liên ngành", "kw": [], "aliases": []},
}

# alias (chữ thường, không dấu) → slug, build 1 lần
_ALIAS_TO_SLUG: dict[str, str] = {}
for _slug, _info in LEGAL_DOMAINS.items():
    for _a in _info["aliases"]:
        _ALIAS_TO_SLUG[_a] = _slug


def _strip_accents(s: str) -> str:
    # đ/Đ là ký tự riêng (không phải dấu tổ hợp) → thay tay trước khi NFD strip.
    s = s.replace("đ", "d").replace("Đ", "D")
    nf = unicodedata.normalize("NFD", s)
    return "".join(c for c in nf if unicodedata.category(c) != "Mn")


def _norm(s: str) -> str:
    """Chuẩn hoá để khớp alias: bỏ dấu, lower, gộp khoảng trắng, bỏ dấu phẩy/gạch."""
    s = _strip_accents(s or "").lower()
    s = s.replace(",", " ").replace("-", " ").replace("/", " ")
    return re.sub(r"\s+", " ", s).strip()


def major_to_slug(major: str) -> str | None:
    """Map 1 chuỗi major nguồn (vd 'Giao thông Vận tải') → slug chuẩn ('giao_thong').

    Trả None nếu không khớp alias nào (caller tự quyết: bỏ hoặc gán slug khác)."""
    if not major:
        return None
    return _ALIAS_TO_SLUG.get(_norm(major))


def majors_to_slugs(majors: list[str]) -> list[str]:
    """Map list majors nguồn → list slug chuẩn (dedupe, giữ thứ tự)."""
    out: list[str] = []
    for m in majors or []:
        slug = major_to_slug(m)
        if slug and slug not in out:
            out.append(slug)
    return out


# từ khóa (đã norm) → slug, build 1 lần từ field 'kw'
_KW_TO_SLUG: list[tuple[str, str]] = []
for _slug, _info in LEGAL_DOMAINS.items():
    for _k in _info.get("kw", []):
        _KW_TO_SLUG.append((_norm(_k), _slug))
# khớp từ khóa dài trước (cụ thể hơn) để 'an toan ve sinh lao dong' không thua 'lao dong'
_KW_TO_SLUG.sort(key=lambda x: -len(x[0]))


def title_to_slugs(title: str) -> list[str]:
    """Suy slug từ TÊN văn bản (chính xác nhất cho luật lõi). Dedupe, giữ thứ tự."""
    t = _norm(title)
    out: list[str] = []
    for kw, slug in _KW_TO_SLUG:
        if kw and kw in t and slug not in out:
            out.append(slug)
    return out


def olddomain_to_slug(old: str) -> str | None:
    """Map 1 slug domain-LLM-cũ (đã không dấu, vd 'tai_chinh_ngan_hang') → chuẩn."""
    if not old:
        return None
    return _ALIAS_TO_SLUG.get(_norm(old.replace("_", " ")))


def assign_domains(title: str, majors: list[str] | None = None,
                   old_domains: list[str] | None = None, max_tags: int = 3) -> list[str]:
    """Gán 1-`max_tags` slug cho 1 document từ 3 nguồn (ưu tiên title rule).

    (A) title → (B) majors nguồn → (C) domains-LLM-cũ. Union, cap. Rỗng → ['khac']."""
    out: list[str] = []

    def _add(slugs):
        for s in slugs:
            if s and s != "khac" and s not in out:
                out.append(s)

    _add(title_to_slugs(title))
    _add(majors_to_slugs(majors or []))
    _add([s for s in (olddomain_to_slug(d) for d in (old_domains or [])) if s])
    return out[:max_tags] if out else ["khac"]


# Danh sách slug hợp lệ (để validate/ràng buộc prompt). 'khac' là fallback.
VALID_SLUGS = list(LEGAL_DOMAINS.keys())
