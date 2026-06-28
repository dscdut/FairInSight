import React, { useState, useEffect } from 'react'

import { Loader2, CheckCircle2, XCircle, X, FileClock } from 'lucide-react'

import { cn } from '@/core/lib/utils'
import { useIngestStore, type IngestJob } from '@/core/store/features/ingest/useIngestStore'

// Bảng theo dõi văn bản ĐANG/ĐÃ nạp trong phiên — hiện dưới bảng danh sách luật. Chỉ
// render khi có ít nhất 1 job (admin chưa nạp gì thì ẩn hẳn). Nguồn dữ liệu = ingest store
// (sống khi rời trang rồi quay lại). confirm mất ~9 phút nên cần theo dõi khi nạp nhiều.

// Thời gian đã trôi dạng "Xm Ys". Job xong thì tính tới finishedAt, đang chạy tới now.
const formatElapsed = (startedAt: number, finishedAt?: number, now?: number) => {
  const end = finishedAt ?? now ?? Date.now()
  const sec = Math.max(0, Math.floor((end - startedAt) / 1000))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

const StatusBadge: React.FC<{ job: IngestJob }> = ({ job }) => {
  if (job.status === 'running') {
    return (
      <span className='inline-flex items-center gap-1.5 text-[11px] font-bold text-primary'>
        <Loader2 className='w-3.5 h-3.5 animate-spin' />
        Đang nạp
      </span>
    )
  }
  if (job.status === 'success') {
    return (
      <span className='inline-flex items-center gap-1.5 text-[11px] font-bold text-success-primary'>
        <CheckCircle2 className='w-3.5 h-3.5' />
        Hoàn tất
      </span>
    )
  }
  return (
    <span className='inline-flex items-center gap-1.5 text-[11px] font-bold text-error-primary'>
      <XCircle className='w-3.5 h-3.5' />
      {job.isDuplicate ? 'Đã tồn tại' : 'Thất bại'}
    </span>
  )
}

export const IngestTrackerTable: React.FC = () => {
  const jobs = useIngestStore((s) => s.jobs)
  const removeJob = useIngestStore((s) => s.removeJob)
  const clearFinished = useIngestStore((s) => s.clearFinished)

  // Đồng hồ 1s để cập nhật cột "thời gian" của job đang chạy (re-render mỗi giây).
  // Chỉ chạy khi có job running để khỏi tick vô ích.
  const hasRunning = jobs.some((j) => j.status === 'running')
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!hasRunning) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [hasRunning])

  if (jobs.length === 0) return null

  const runningCount = jobs.filter((j) => j.status === 'running').length
  const hasFinished = jobs.some((j) => j.status !== 'running')

  return (
    <section className='border border-border-secondary bg-background-primary rounded-2xl shadow-sm overflow-hidden'>
      {/* Header bảng */}
      <div className='flex items-center justify-between px-6 py-4 border-b border-border-secondary bg-background-secondary/40'>
        <div className='flex items-center gap-2'>
          <FileClock className='w-4.5 h-4.5 text-primary' />
          <h3 className='text-sm font-bold text-text-primary'>
            Tiến trình nạp văn bản
          </h3>
          {runningCount > 0 && (
            <span className='inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/20'>
              {runningCount} đang chạy
            </span>
          )}
        </div>
        {hasFinished && (
          <button
            type='button'
            onClick={clearFinished}
            className='text-[11px] font-bold text-text-tertiary hover:text-text-primary transition-colors'
          >
            Xoá mục đã xong
          </button>
        )}
      </div>

      {/* Danh sách job */}
      <div className='divide-y divide-border-secondary'>
        {jobs.map((job) => (
          <div
            key={job.id}
            className='flex items-center gap-4 px-6 py-4 hover:bg-background-secondary/20 transition-colors'
          >
            {/* Tên + thời gian */}
            <div className='min-w-0 flex-1 flex flex-col gap-0.5'>
              <span className='text-sm font-bold text-text-primary truncate'>
                {job.title}
              </span>
              <span className='text-[11px] text-text-tertiary font-semibold'>
                {job.status === 'running'
                  ? `Đã nạp ${formatElapsed(job.startedAt, undefined, now)} • quá trình có thể mất vài phút`
                  : job.isDuplicate
                    ? job.message || 'Văn bản này đã có trong hệ thống.'
                    : job.status === 'error'
                      ? 'Nạp thất bại — vui lòng thử lại'
                      : `Hoàn tất sau ${formatElapsed(job.startedAt, job.finishedAt)}`}
              </span>
            </div>

            {/* Trạng thái */}
            <div className='shrink-0'>
              <StatusBadge job={job} />
            </div>

            {/* Nút đóng — chỉ cho job đã kết thúc (đang chạy thì không cho xoá khỏi UI) */}
            <button
              type='button'
              onClick={() => removeJob(job.id)}
              disabled={job.status === 'running'}
              title={job.status === 'running' ? 'Đang nạp, không thể đóng' : 'Đóng dòng này'}
              className={cn(
                'shrink-0 p-1.5 rounded-lg transition-all',
                job.status === 'running'
                  ? 'text-text-tertiary/40 cursor-not-allowed'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-background-secondary'
              )}
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
