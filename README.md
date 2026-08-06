# FairInSight ⚖️

FairInSight là nền tảng LegalTech ứng dụng AI để hỗ trợ người dùng tiếp cận thông tin pháp luật Việt Nam một cách có căn cứ, có trích dẫn và có khả năng chuyển tiếp sang luật sư khi vụ việc vượt quá phạm vi tự động hóa.

Dự án được định hướng theo tinh thần đổi mới sáng tạo: tạo ra một sản phẩm công nghệ có giá trị xã hội, giúp giảm khoảng cách giữa người dân và hệ thống pháp luật. FairInSight tập trung vào tra cứu, phân tích, chuẩn bị hồ sơ và hỗ trợ ra quyết định ban đầu; AI đóng vai trò trợ lý **định vị pháp lý**, truy xuất căn cứ, gợi ý hướng xử lý và nhận diện khi cần kết nối chuyên gia pháp lý.

Tóm lại, FairInsight không thay thế luật sư. FairInsight giúp người dân hiểu vấn đề của mình trước khi gặp luật sư, giúp luật sư tiếp nhận vụ việc nhanh hơn, và giúp pháp luật trở nên dễ tiếp cận hơn bằng AI có căn cứ, có nguồn và có kiểm chứng.

## Tổng Quan

- Trợ lý AI pháp lý tiếng Việt với mô hình Graph RAG + Agent, citation và kiểm tra căn cứ.
- Chat pháp lý theo phiên, hỗ trợ câu hỏi tiếp nối và phân loại mức độ phân tích.
- Kho văn bản pháp luật, ingestion pipeline và quản lý trạng thái hiệu lực.
- Hệ thống luật sư: hồ sơ, chuyên môn, trạng thái, gợi ý luật sư theo lĩnh vực vụ việc.
- Quy trình tư vấn: lịch hẹn, trao đổi, tạo biểu mẫu/PDF và theo dõi hồ sơ.
- Admin dashboard để quản lý người dùng, luật sư, văn bản và hoạt động hệ thống.
- Billing/credits foundation cho AI usage metering, hiện nên giữ rollout an toàn bằng `SHADOW` hoặc `OFF`.

## Mô Hình AI

FairInSight được xây theo hướng **RAG Agent pháp lý Việt Nam**: AI không trả lời như một chatbot hộp đen, mà phải tìm căn cứ, đối chiếu hiệu lực và kiểm chứng nguồn trước khi kết luận. Mô hình hướng tới việc biến mô tả đời thường của người dùng thành một **bản định vị pháp lý** có cấu trúc: vấn đề chính là gì, căn cứ nào liên quan, còn thiếu thông tin gì, rủi ro ở đâu và bước tiếp theo nên chuẩn bị thế nào.

Về phương pháp, hệ thống kết hợp **Agentic RAG**, **đồ thị tri thức pháp luật** và cách suy luận theo **IRAC**: xác định Issue, tra Rule còn hiệu lực, Apply vào tình huống và đưa ra Conclusion có giới hạn. AI Agent có các công cụ như tìm kiếm ngữ nghĩa, liệt kê điều luật, kiểm tra trích dẫn và tra trạng thái hiệu lực; Agent lặp đến khi đủ căn cứ mới trả lời, nếu thiếu căn cứ thì phải nói rõ thay vì tự bịa.

Hướng triển khai của FairInSight là **model-agnostic**: có thể thay đổi hoặc kết hợp nhiều mô hình AI khác nhau, trong khi lớp kiểm chứng, citation, guardrail, lịch sử phiên và kết nối luật sư vẫn là phần lõi của sản phẩm. Vì vậy chất lượng không chỉ phụ thuộc vào một LLM, mà phụ thuộc vào toàn bộ quy trình truy xuất, kiểm chứng và đóng gói hồ sơ.

## Kiến Trúc

```text
frontend/       React + Vite + TypeScript
backend/        Node.js + Express + Prisma + PostgreSQL
AI/rag_agent/   Python FastAPI + RAG/legal reasoning workflow
.github/        GitHub Actions cho FE/BE build, lint, test
```

## Yêu Cầu

- Node.js 20.x
- npm
- PostgreSQL 16 hoặc PostgreSQL compatible
- Python 3.12 cho `AI/rag_agent`
- Ollama hoặc LLM provider tương thích nếu chạy đầy đủ AI/RAG

Trên Windows, dùng `npm.cmd` nếu PowerShell chặn `npm.ps1`.

## Chạy Local

Backend:

```bash
cd backend                                      # vào backend service
npm ci                                          # cài dependency đúng package-lock
cp .env.example .env                            # tạo env local, Windows có thể copy thủ công
npm run db:migrate                              # tạo/cập nhật schema database local
npm run db:seed                                 # thêm dữ liệu mẫu: roles, lawyers, templates, billing fixtures
npm run dev                                     # chạy API tại http://localhost:3000
```

Frontend:

```bash
cd frontend                                     # vào frontend app
npm ci                                          # cài dependency đúng package-lock
cp .env.example .env                            # tạo env local, Windows có thể copy thủ công
npm run dev                                     # chạy Vite app, thường tại http://localhost:5173
```

AI service:

```bash
cd AI/rag_agent                                 # vào AI runtime hiện tại
cp .env.example .env                            # tạo env local, Windows có thể copy thủ công
.\.venv\Scripts\python.exe main.py              # chạy AI service tại http://localhost:8000
```

## Env Tối Thiểu

Backend `backend/.env`:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fairinsight?schema=public
JWT_SECRET=your_jwt_secret
BILLING_MODE=SHADOW
CHAT_GATEWAY_ENABLED=true
AI_SERVICE_BASE_URL=http://localhost:8000
FIS_SERVICE_KEY_ID=local-v1
FIS_SERVICE_SECRET=your-32-byte-minimum-service-secret
```

Frontend `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_AI_API_URL=http://localhost:8000/api/v1
VITE_CHAT_GATEWAY_ENABLED=true
```

AI `AI/rag_agent/.env`:

```env
JWT_SECRET=your_jwt_secret
FIS_HMAC_SHARED_SECRET=your-32-byte-minimum-service-secret
```

`FIS_SERVICE_SECRET` ở Backend và `FIS_HMAC_SHARED_SECRET` ở AI phải cùng một giá trị 32+ byte để xác thực request Backend -> AI.

## Database, Migration Và Seed

```bash
cd backend                                      # thao tác DB nằm trong backend
npm run db:migrate                              # dùng cho local/dev: chạy Prisma migrate dev
npm run db:seed                                 # tạo/cập nhật dữ liệu mẫu phục vụ demo/dev
npx prisma migrate reset                        # reset sạch DB local, chỉ dùng khi chấp nhận mất dữ liệu
```

Seed hiện có thể tạo hoặc cập nhật:

- roles và tài khoản mẫu
- specialties và hồ sơ luật sư demo
- templates pháp lý
- billing plans, rate cards, subscriptions, wallets và credit lots demo

Không chạy seed trực tiếp trên production nếu chưa review dữ liệu sẽ được thêm/sửa.

## Kiểm Tra

Backend:

```bash
cd backend                                      # vào backend service
npm run lint                                    # lint JS, có auto-fix theo script hiện tại
npm test --if-present                           # chạy backend tests nếu có
npm run build --if-present                      # build Babel ra dist
```

Frontend:

```bash
cd frontend                                     # vào frontend app
npm run lint                                    # lint TypeScript/React
npm test --if-present                           # chạy Jest tests nếu có
npm run build                                   # typecheck + Vite production build
```

AI:

```bash
cd AI/rag_agent                                 # vào AI runtime
.\.venv\Scripts\python.exe -m pytest             # chạy test suite AI, pipeline test có thể mất vài phút
```

## CI/CD

GitHub Actions hiện kiểm tra:

- Backend: `npm ci`, `npm test --if-present`, `npm run build --if-present`
- Frontend: `npm ci`, `npm run lint --if-present`, `npm test --if-present`, `npm run build`

Workflow deploy backend trên nhánh `dev` chạy trên self-hosted runner, pull code, build backend và restart PM2 process. Migration production nên chạy bằng quy trình riêng, không tự động seed.

## Lưu Ý Bảo Mật

- Không commit `.env`, token, private key hoặc shared secret.
- `JWT_SECRET` dùng cho xác thực user.
- `FIS_SERVICE_SECRET`/`FIS_HMAC_SHARED_SECRET` dùng cho xác thực Backend -> AI.
- AI không nên tin `user_id` truyền trong body; identity phải đến từ Backend/JWT đã xác thực.
- Billing nên giữ `SHADOW` hoặc `OFF` cho đến khi hoàn tất kiểm thử accounting, retry, refund và security.

## Định Hướng

FairInSight hướng tới một hệ thống pháp lý AI có trách nhiệm:

- Trả lời có căn cứ, không bịa điều luật.
- Nêu rõ khi thiếu dữ kiện hoặc thiếu chứng cứ pháp lý.
- Phân biệt tra cứu nhanh và phân tích vụ việc sâu.
- Bảo toàn dữ kiện người dùng cung cấp.
- Khuyến nghị luật sư khi vụ việc có rủi ro cao.
- Ghi nhận usage/billing minh bạch, không tính phí cho lỗi provider hoặc câu trả lời không đạt chuẩn.

### Attribution & Academic Integrity

Không được sao chép, đổi tên, xóa dấu vết tác giả hoặc nộp lại dự án này như sản phẩm tự làm nếu không có ghi nhận nguồn phù hợp. Mọi reuse trong học thuật, cuộc thi hoặc portfolio cần ghi rõ FairInSight và nhóm/tác giả gốc.

```text
Copyright (c) 2026 FairInSight Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files, to deal in the Software
without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the
Software, subject to the condition that the copyright notice and this permission
notice shall be included in all copies or substantial portions of the Software.
```
