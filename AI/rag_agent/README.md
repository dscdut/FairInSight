---
# FairInSight — AI Backend (backend_reasoning)

Hệ AI pháp lý tiếng Việt: tra cứu + suy luận trên kho ~4.000 văn bản luật (Hiến pháp, bộ luật, luật, nghị định, thông tư) đã được vector hóa. Chạy độc lập cổng **8000**, giao tiếp với BE chính (Node) và FE qua HTTP.

- **Embedding** `bge-m3` (1024 chiều) — đóng sẵn trong image (CPU) hoặc gọi Ollama.
- **Reranker** `bge-reranker-v2-m3` — đóng sẵn trong image (CPU).
- **Chat LLM** gọi ra ngoài: 9router (Groq/Gemini) hoặc Ollama/gemma4 qua tunnel.

---

## A. PIPELINE CHAT — trả lời câu hỏi pháp lý

Toàn bộ điều phối ở `workflows/chat_graph.py` (LangGraph). Có 2 nhánh chính:
**lookup** (tra nhanh) và **deep** (suy luận nhiều bước cho vụ việc cá nhân).

```text
[1] session_loader → [2] normalizer → [3] guardrail → [4] mode_router
      ├── greeting/abusive/out_of_scope → [out_of_scope] → [persist] → END
      ├── deep_pending → [ask_deep_confirmation] → [persist] → END
      ├── LOOKUP:  [5] build_query → [6] retrieve → [7] legal_status_check
      │            → [8] legal_expansion → [9] composer → [10] citation_verifier
      │            → [11] risk_check → [12] persist → END
      └── DEEP:   [D1] case_frame → [D2] fact_extractor → [D3] hypothesis
                  → [D4] missing_fact_checker
                       ├── thiếu dữ kiện chặn → [ask_user_facts] → [persist] → END
                       └── đủ → [D5] investigation_retrieve ⇄ [D6] evidence_judge  (lặp tối đa 3 vòng)
                              → [D7] reasoning_router → [legal_status_check]
                              → [legal_expansion] → [D8] final_composer
                              → [citation_verifier] → [risk_check] → [persist] → END
```

**[1] session_loader** — nạp 6 lượt chat gần nhất của phiên (để hiểu câu hỏi follow-up).
Đánh dấu phiên đã từng "deep" chưa, đã hỏi lại user chưa.

**[2] normalizer** — nếu câu hỏi là follow-up ngắn ("điều đó còn hiệu lực không?") thì
LLM viết lại thành câu độc lập, đủ ngữ cảnh (văn bản đã nhắc).

**[3] guardrail** — chặn TẦNG RULE (rẻ, không gọi LLM): tấn công prompt, tự gây hại
(→ hotline), thô tục. KHÔNG chặn chủ đề luật nhạy cảm (hỏi "tội ma túy phạt mấy năm" là hợp lệ).

**[4] mode_router** — LLM đọc câu hỏi + lịch sử, chọn luồng: `greeting` / `lookup` /
`deep_pending` (vụ việc cá nhân, cần phân tích).

**[5] build_query** — trích "locator" từ câu hỏi: tên văn bản, số Điều, số Khoản.
Quyết định dùng retriever `citation` (tra đích danh) hay `hybrid` (tra theo nghĩa).

**[6] retrieve** — lấy căn cứ:
- Có số hiệu + Điều cụ thể → tra thẳng Điều đó.
- Còn lại → **hybrid**: vector (bge-m3) + từ khóa (BM25).
- Điều có nội dung ngắn → gộp thêm nội dung Khoản/Điểm con để LLM đủ ngữ liệu.

**[7] legal_status_check** — với mỗi căn cứ, kiểm tra xem Điều này đã bị sửa/thay/bãi (đọc `units.unit_status` + bảng `amendments`). Gắn cờ ⚠️ stale.

**[8] legal_expansion** — nếu căn cứ đã bị thay đổi, kéo Điều **hiện hành** vào.
Đồng thời kéo: văn bản hướng dẫn thi hành (NĐ/TT), Điều được dẫn chiếu (đối chiếu điều kiện).

**[9] composer** (lookup) — LLM soạn câu trả lời dựa trên căn cứ,
dẫn đích danh "Điều X Luật Y năm (số hiệu)", kết bằng dòng **Căn cứ**.

**[10] citation_verifier** — kiểm AI có bịa Điều luật không; lọc danh sách trích dẫn thực sự dùng; cảnh báo nếu trích phải căn cứ đã hết hiệu lực.

**[11] risk_check** — đánh rủi ro (rule): chủ đề hình sự/tranh chấp/ly hôn hoặc vụ việc
deep → `high` → thêm khuyến cáo gặp luật sư.

**[12] persist** — lưu tin user + tin trả lời + snapshot reasoning vào `chat_messages`.

### Nhánh DEEP (vụ việc cá nhân)
- **[D1] case_frame** — dựng khung vụ việc (các bên, lĩnh vực, loại vụ).
- **[D2] fact_extractor** — trích dữ kiện đã biết từ lời kể (không bịa).
- **[D3] hypothesis** — sinh các câu hỏi pháp lý giả định (để tra cứu nội bộ).
- **[D4] missing_fact_checker** — thiếu dữ kiện then chốt → hỏi lại user 1 lần; nếu đủ → tra.
- **[D5]⇄[D6] investigation loop** — tra theo từng hypothesis, "thẩm phán" (LLM) đánh giá đủ chứng cứ chưa; chưa đủ thì tra thêm (tối đa 3 vòng).
- **[D7] reasoning_router** — chọn nhánh suy luận (chế tài / thủ tục / hiệu lực / quyền-nghĩa vụ).
- **[D8] final_composer** — soạn câu trả lời phân tích tình huống / hướng giải quyết / căn cứ đã dùng.

---

## B. PIPELINE INGEST — nạp 1 văn bản vào kho

Điều phối ở `workflows/ingest_graph.py`. Nguồn vào: PDF (OCR) hoặc link VBPL (text sạch).

```text
[1] prepare → [2] extract → [3] normalize → [4] llm_fix → [5] metadata
   → [6] unit_tree → [7] chunk → [8] embed → [9] relation → [10] relation_judge
   → [11] tagging → [12] publish → END
        (prepare trùng/lỗi → END;  normalize text rỗng → fail → END)
```

> **12 node mạch chính.** Chỉ **[6] unit_tree** có vòng lặp (cắt–kiểm–sửa); chỉ **[12] publish**
> ghi DB. Mọi node trước chỉ bồi thêm vào `state` (1 dict trong RAM). Node **CHÍNH** (logic
> nặng): [1] prepare, [2] extract, [6] unit_tree, [9] relation, [10] relation_judge, [12] publish.

**[1] prepare** — tính checksum (chống nạp trùng), tạo bản ghi `source_files`.
*Tự gỡ mồ côi:* nếu checksum trùng nhưng văn bản cũ chưa hoàn tất (status `parsing`/`failed`,
0 document) → đó là rác từ lần nạp lỗi giữa chừng, xóa. Chặn khi đã `completed`.

**[2] extract** — lấy text. Nguồn link VBPL có sẵn text → bỏ qua OCR. PDF scan → OCR (EasyOCR, có swap VRAM nếu GPU nhỏ).

**[3] normalize** — chuẩn hóa text (NFC, gộp khoảng trắng, giữ xuống dòng, cắt phụ lục sau chữ ký). Rỗng → fail.

**[4] llm_fix** — sửa lỗi OCR bằng LLM (chữ "Đỉều"→"Điều"...). **Bỏ qua** với nguồn VBPL/digital (text đã sạch) hoặc khi chạy offline.

**[5] metadata** — rút loại văn bản, tier A/B/C, số hiệu, ngày hiệu lực, cơ quan ban hành, phạm vi + cờ `is_amendment_doc`. Áp `meta_overrides` (admin xác nhận) nếu có.

**[6] unit_tree** *(NODE CHÍNH — vòng lặp có cổng chặn, gói tới `step4.run_step4`)* — dựng cây Phần→Chương→Mục→Điều→Khoản→Điểm bằng **smart_cut** (state-machine "expected-next", tự lọc Điều-nhúng/dẫn chiếu giả, không cần markup trước). Sau khi cắt, **kiểm DFS** cấu trúc (Điều liên tục 1→N, không trùng, phân cấp đúng): nếu `error` thì **đổi chiến lược cắt** theo ladder (smart→rule→llm→regex, ≤3 vòng, chỉ nhận bản tốt hơn). Cạn cách vẫn `error` → giữ bản tốt nhất + bật cờ **`needs_review`** (cổng chặn: [12] sẽ không cho vào KB active).

**[7] chunk** — cắt mảnh để embedding, gắn breadcrumb (VD: Chương III | Điều 12).

**[8] embed** — gọi bge-m3 tạo vector (1024 chiều).

**[9] relation** — sinh quan hệ ỨNG VIÊN bằng regex (dẫn chiếu / nội bộ / ra ngoài theo tên luật).

**[10] relation_judge** — LLM đọc lời văn, grounding trên tập **Căn cứ**, trả JSON quan hệ (amendment + reference) chính xác; gộp với ứng viên regex.

**[11] tagging** — qwen3 đề xuất domain/topic (chỉ Tier A; lỗi thì bỏ tag, vẫn nạp).

**[12] publish** *(NODE CHÍNH — bước DUY NHẤT ghi DB)* — lưu document + units + chunks + quan hệ, resolve, commit 1 transaction. Nếu `needs_review=True` → set `ingest_status='needs_review'` + đẩy `review_items`, KHÔNG `completed` (chặn rác trôi vào KB).

---

## C. CẤU TRÚC DATABASE (PostgreSQL + pgvector)

11 bảng, chia 4 nhóm. Mô tả "cái gì lưu gì, nối với gì":

### Nhóm NẠP & VĂN BẢN
- **`source_files`** — mỗi FILE/nguồn nạp vào, lưu checksum (chống trùng).
- **`documents`** — metadata cấp văn bản (số hiệu, ngày hiệu lực...).
- **`units`** — đơn vị (Điều/Khoản). Có `unit_status` (còn/hết hiệu lực).
- **`chunks`** — đoạn text ngắn + vector (pgvector).

### Nhóm QUAN HỆ & THAM CHIẾU
- **`amendments`** — văn bản này "sửa đổi, bổ sung" văn bản kia. Nối document → document, hoặc unit → unit.
- **`references`** — "áp dụng theo quy định tại Điều kia" (ly hôn → tài sản → đất đai). Nối Điều-nguồn (`from_unit_id`) → Điều-đích (`to_unit_id`, NULL khi chưa resolve). Dùng để chat đối chiếu điều kiện liên thông giữa các luật.

> ⚠️ Lưu ý: khi nạp lại 1 luật, units cũ bị xóa. Amendment/reference đang trỏ tới chúng nếu
> không được dọn sẽ thành "quan hệ ảo" (dangling — dây nối trỏ vào hư không). Cần FK CASCADE
> hoặc dọn tay. Phân biệt với "chưa resolve" (đích NULL — là chờ nối hợp lệ, KHÔNG xóa).

### Nhóm PHÂN LOẠI
- **`legal_tags`** — từ điển lĩnh vực/chủ đề pháp lý (cây cha-con: topic `ly_hon` thuộc domain `hon_nhan_gia_dinh`).
- **`document_tags`** — bảng nối nhiều-nhiều: gắn tag cho document.

### Nhóm LOG & CHAT
- **`chat_sessions`** & **`chat_messages`** — lưu lịch sử chat.
- **`review_items`** — hàng đợi cần người duyệt: chất lượng parse kém, xung đột metadata, quan hệ chưa resolve... (nguồn từ `source_files`).

### Quan hệ tổng quát
```text
source_files ──1:N──> documents ──1:N──> units ──1:N──> chunks
                                            │
                          amendments / references (quan hệ giữa các luật)
documents ──N:N──> legal_tags  (qua document_tags)
chat_sessions ──1:N──> chat_messages
```