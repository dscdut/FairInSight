// Store theo dõi các văn bản ĐANG NẠP vào KB (confirm ~9 phút/văn bản, chạy nền).
//
// Vì sao là store toàn cục (không phải state trong trang): admin nạp xong có thể rời
// trang legal-documents sang trang khác rồi quay lại — state trong component sẽ mất khi
// unmount. Store sống suốt phiên SPA nên quay lại vẫn thấy tiến trình. (F5 thì mất —
// chấp nhận, vì BE confirm không có job-id để khôi phục.)
//
// Store tự GỌI confirmLaw và cập nhật trạng thái từng job → trang chỉ cần đọc danh sách
// + gọi startIngest, không giữ promise. Nhiều văn bản nạp song song = nhiều job.
import { create } from 'zustand'

import { lawAiApi, type ConfirmLawPayload } from '@/core/services/law-ai.service'

export interface IngestJob {
  id: string // id cục bộ (client) để track row
  title: string // tên văn bản hiển thị
  status: 'running' | 'success' | 'error'
  startedAt: number // epoch ms — tính thời gian đã nạp
  finishedAt?: number
  message?: string // nội dung lỗi (vd 409: đã tồn tại)
  isDuplicate?: boolean // 409 — phân biệt "đã tồn tại" với lỗi thật
}

interface IngestState {
  jobs: IngestJob[]
  // Bắt đầu nạp 1 văn bản: thêm job 'running' + gọi confirmLaw nền, tự cập nhật khi xong.
  // onDone gọi sau khi 1 job thành công (để trang reload danh sách).
  startIngest: (payload: ConfirmLawPayload, title: string, onDone?: () => void) => void
  // Xoá 1 job khỏi bảng (admin đóng dòng đã xong/lỗi).
  removeJob: (id: string) => void
  // Xoá hết job đã kết thúc (success/error), giữ job đang chạy.
  clearFinished: () => void
}

// id cục bộ: không dùng Math.random ở module-top (vẫn ok trong handler). Dựa thời gian
// + đếm để chắc duy nhất khi bấm nạp liên tiếp trong cùng ms.
let _counter = 0
const nextId = () => `ingest-${Date.now()}-${_counter++}`

export const useIngestStore = create<IngestState>((set) => ({
  jobs: [],

  startIngest: (payload, title, onDone) => {
    const id = nextId()
    const job: IngestJob = {
      id,
      title: title || 'Văn bản mới',
      status: 'running',
      startedAt: Date.now(),
    }
    set((s) => ({ jobs: [job, ...s.jobs] }))

    const patch = (changes: Partial<IngestJob>) =>
      set((s) => ({
        jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...changes } : j)),
      }))

    // Fire-and-forget: không await (store không block). Kết quả phản ánh vào job.
    void lawAiApi
      .confirmLaw(payload)
      .then(() => {
        patch({ status: 'success', finishedAt: Date.now() })
        onDone?.()
      })
      .catch((error: unknown) => {
        // 409 = văn bản đã tồn tại (trùng file đã nạp) → báo rõ thay vì "thất bại".
        const status = (error as { response?: { status?: number } })?.response?.status
        const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail
        patch({
          status: 'error',
          finishedAt: Date.now(),
          isDuplicate: status === 409,
          message:
            status === 409 ? detail || 'Văn bản này đã có trong hệ thống.' : undefined,
        })
      })
  },

  removeJob: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),

  clearFinished: () =>
    set((s) => ({ jobs: s.jobs.filter((j) => j.status === 'running') })),
}))
