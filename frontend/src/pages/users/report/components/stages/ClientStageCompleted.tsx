import { FileText, Download, Star, CheckCircle, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/core/lib/utils';
import { type ConsultationProcess, type ConsultationStage } from '@/core/services/consultation.service';

interface ClientStageCompletedProps {
  process: ConsultationProcess;
  isClient: boolean;
  partnerName: string;
  rating: number;
  setRating: (v: number) => void;
  reviewComment: string;
  setReviewComment: (v: string) => void;
  handleReviewSubmit: () => Promise<void>;
  submittingReview: boolean;
  handleSkip: (stage: ConsultationStage) => Promise<void>;
  onClose: (() => void) | undefined;
}

export default function ClientStageCompleted({
  process,
  isClient,
  partnerName,
  rating,
  setRating,
  reviewComment,
  setReviewComment,
  handleReviewSubmit,
  submittingReview,
  handleSkip,
  onClose
}: ClientStageCompletedProps) {
  return (
    <div className='flex-1 flex flex-col space-y-4 text-left min-h-0 w-full'>
      {process.current_stage === 'REJECTED' ? (
        <div className='flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto py-10 w-full'>
          <div className='w-12 h-12 bg-danger-primary/10 rounded-full flex items-center justify-center text-danger-secondary ring-8 ring-danger-primary/5 shrink-0'>
            <ShieldAlert className='w-6 h-6' />
          </div>
          <div className='space-y-1.5'>
            <h3 className='font-bold text-sm text-text-primary'>Yêu cầu bị từ chối</h3>
            <p className='text-[11px] text-text-description leading-relaxed'>
              Yêu cầu kết nối tư vấn chuyên sâu của bạn đã bị từ chối bởi luật sư. Vui lòng quay trở lại danh sách và kết nối với luật sư khác có chuyên môn phù hợp hơn.
            </p>
          </div>
          {onClose && (
            <Button onClick={onClose} variant='secondary' className='px-5 py-2 text-xs font-semibold rounded border border-border-primary shadow-sm hover:bg-slate-50'>
              Quay lại
            </Button>
          )}
        </div>
      ) : process.current_stage === 'REVIEWED' ? (
        <div className='flex-1 flex flex-col space-y-4 text-left min-h-0 w-full'>
          {/* Status Info */}
          <div className='p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-3 shrink-0'>
            <CheckCircle className='w-5 h-5 text-emerald-600 shrink-0 mt-0.5' />
            <div className='text-left space-y-0.5'>
              <h4 className='font-bold text-emerald-800 text-xs'>Hồ sơ tư vấn đã được đóng</h4>
              <p className='text-[10px] text-emerald-700/80 leading-relaxed'>
                Quy trình tư vấn chuyên sâu đã kết thúc tốt đẹp. Toàn bộ thông tin biên bản và lịch sử chat đã được ghi nhận lưu trữ.
              </p>
            </div>
          </div>

          {/* Submission Result / Outcome (APPROVED/REJECTED) */}
          {process.portal_status && (
            <div className={cn(
              'p-3.5 rounded-xl border flex items-start gap-3 shrink-0 text-left',
              process.portal_status === 'APPROVED'
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                : 'bg-red-50/50 border-red-200 text-red-800'
            )}>
              {process.portal_status === 'APPROVED' ? (
                <CheckCircle className='w-5 h-5 text-emerald-600 shrink-0 mt-0.5' />
              ) : (
                <ShieldAlert className='w-5 h-5 text-red-600 shrink-0 mt-0.5' />
              )}
              <div className='space-y-1'>
                <h5 className='font-bold text-xs'>
                  Kết quả giải quyết hồ sơ:{' '}
                  {process.portal_status === 'APPROVED' ? 'Thành công (Được chấp thuận)' : 'Thất bại (Từ chối)'}
                </h5>
                {process.portal_feedback && (
                  <p className='text-[10px] opacity-90 leading-relaxed font-medium'>
                    Phản hồi từ Luật sư: {process.portal_feedback}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Advice summary and PDF download */}
          <div className='border border-border-secondary p-3.5 rounded-xl bg-slate-50 space-y-2.5'>
            <h4 className='font-bold text-text-primary flex items-center gap-1.5 text-xs'>
              <FileText className='w-4 h-4 text-primary' />
              Biên bản lời khuyên tư vấn đã xuất bản
            </h4>
            <p className='text-[11px] text-text-secondary leading-relaxed bg-white p-3 rounded border border-border-primary whitespace-pre-line'>
              {process.advice_summary || 'Không có bản tóm tắt văn bản.'}
            </p>
            {process.pdf_url && (
              <Button
                onClick={() => window.open(process.pdf_url!, '_blank')}
                className='w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded text-xs gap-1.5 shadow-sm'
              >
                <Download className='w-4 h-4' />
                Tải Biên bản Tư vấn (PDF)
              </Button>
            )}
          </div>

          {/* Review outcome details */}
          <div className='border border-border-secondary p-3.5 rounded-xl bg-white space-y-2 shadow-sm shrink-0'>
            <h4 className='font-bold text-text-primary text-xs'>Kết quả nhận xét đánh giá</h4>
            <div className='flex items-center gap-1.5 py-0.5'>
              <span className='text-[11px] font-bold text-text-primary'>Đánh giá sao:</span>
              <div className='flex items-center text-amber-400'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className='w-4 h-4'
                    fill={star <= (process.rating || 5) ? '#fbbf24' : 'none'}
                    stroke={star <= (process.rating || 5) ? '#fbbf24' : '#cbd5e1'}
                  />
                ))}
              </div>
            </div>
            <p className='text-[11px] text-text-secondary leading-relaxed italic bg-slate-50 p-2.5 rounded border border-border-secondary'>
              &ldquo;{process.review_comment || 'Không có nhận xét bằng văn bản.'}&rdquo;
            </p>
          </div>

          {onClose && (
            <Button onClick={onClose} className='w-full py-2 bg-primary hover:bg-primary-600 text-white font-bold rounded text-xs shadow mt-2'>
              Đóng màn hình quy trình
            </Button>
          )}
        </div>
      ) : (
        // COMPLETED STAGE
        <div className='flex-1 flex flex-col space-y-4 text-left min-h-0 w-full'>
          {/* Submission Result / Outcome (APPROVED/REJECTED) */}
          {process.portal_status && (
            <div className={cn(
              'p-3.5 rounded-xl border flex items-start gap-3 shrink-0 text-left',
              process.portal_status === 'APPROVED'
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                : 'bg-red-50/50 border-red-200 text-red-800'
            )}>
              {process.portal_status === 'APPROVED' ? (
                <CheckCircle className='w-5 h-5 text-emerald-600 shrink-0 mt-0.5' />
              ) : (
                <ShieldAlert className='w-5 h-5 text-red-600 shrink-0 mt-0.5' />
              )}
              <div className='space-y-1'>
                <h5 className='font-bold text-xs'>
                  Kết quả giải quyết hồ sơ:{' '}
                  {process.portal_status === 'APPROVED' ? 'Thành công (Được chấp thuận)' : 'Thất bại (Từ chối)'}
                </h5>
                {process.portal_feedback && (
                  <p className='text-[10px] opacity-90 leading-relaxed font-medium'>
                    Phản hồi từ Luật sư: {process.portal_feedback}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className='border border-border-secondary p-3.5 rounded-xl bg-slate-50 space-y-2'>
            <h4 className='font-bold text-text-primary flex items-center gap-1.5 text-xs'>
              <FileText className='w-4 h-4 text-primary' />
              Biên bản lời khuyên tư vấn của Luật sư
            </h4>
            <p className='text-[11px] text-text-secondary leading-relaxed bg-white p-3 rounded border border-border-primary whitespace-pre-line'>
              {process.advice_summary || 'Tư vấn trực tiếp thành công. Không có văn bản tóm tắt.'}
            </p>

            {process.pdf_url && (
              <Button
                onClick={() => window.open(process.pdf_url!, '_blank')}
                className='w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded text-xs gap-1.5 mt-2 shadow-sm'
              >
                <Download className='w-4 h-4' />
                Tải Biên bản Tư vấn (PDF)
              </Button>
            )}
          </div>

          {isClient ? (
            <div className='border border-border-secondary p-4 rounded-xl space-y-3 bg-white shadow-sm shrink-0'>
              <div className='space-y-1'>
                <h4 className='font-bold text-text-primary text-xs'>Đánh giá chất lượng tư vấn</h4>
                <p className='text-[10px] text-text-description'>Cảm nhận của bạn sẽ giúp luật sư cải thiện chuyên môn tốt hơn.</p>
              </div>

              {/* Stars Picker */}
              <div className='flex items-center gap-1.5 py-1'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    type='button'
                    className='cursor-pointer p-0.5 transition-transform active:scale-90'
                  >
                    <Star
                      className='w-6 h-6 transition-colors'
                      fill={star <= rating ? '#fbbf24' : 'none'}
                      stroke={star <= rating ? '#fbbf24' : '#cbd5e1'}
                    />
                  </button>
                ))}
                <span className='text-[11px] font-bold text-amber-500 ml-2'>{rating} / 5 Sao</span>
              </div>

              <div className='space-y-1.5'>
                <label className='font-bold text-text-secondary block'>Lời nhắn nhận xét:</label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder='Luật sư tư vấn nhiệt tình, giải quyết thấu đáo vấn đề của tôi...'
                  className='min-h-[60px] text-xs text-text-primary leading-relaxed'
                />
              </div>

              <div className='flex justify-end pt-1.5'>
                <Button
                  onClick={handleReviewSubmit}
                  disabled={submittingReview}
                  className='bg-primary hover:bg-primary-600 text-white font-bold px-4 py-2 rounded text-xs shadow'
                >
                  {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá & Đóng hồ sơ'}
                </Button>
              </div>
            </div>
          ) : (
            <div className='flex-1 flex flex-col items-center justify-center text-center py-6 space-y-2 border border-dashed border-border-secondary rounded-xl bg-slate-50 p-4'>
              <CheckCircle className='w-8 h-8 text-emerald-500 mb-1' />
              <h4 className='font-bold text-xs text-text-primary'>Tư vấn đã hoàn tất</h4>
              <p className='text-[10px] text-text-description leading-relaxed max-w-xs'>
                Hồ sơ tư vấn đã hoàn thành. Hệ thống đang chờ khách hàng {partnerName} gửi nhận xét và đánh giá sao chất lượng.
              </p>
              <Button
                onClick={() => handleSkip('REVIEWED')}
                variant='ghost'
                className='text-[10px] text-text-secondary border border-border-primary hover:bg-slate-100 font-semibold px-3 py-1 rounded mt-2 shadow-sm'
              >
                Bỏ qua & Đóng hồ sơ trực tiếp
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
