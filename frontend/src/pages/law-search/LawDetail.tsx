import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { LegalContentViewer } from '@/features/legal/components/LegalContentViewer'
import { LegalDetailSkeleton } from '@/features/legal/components/LegalSkeleton'
import { LegalDocumentHeader } from '@/features/legal/components/LegalDocumentHeader'
import { LegalDocumentTabs } from '@/features/legal/components/LegalDocumentTabs'
import { LegalMetadataPanel } from '@/features/legal/components/LegalMetadataPanel'
import { LegalTableOfContents } from '@/features/legal/components/LegalTableOfContents'
import { useLegalDocumentDetail } from '@/features/legal/hooks/useLegalDocuments'
import { MOCK_TOC } from '@/features/legal/utils/mockData'
import type { TabId } from '@/features/legal/components/LegalDocumentTabs'

export default function LawDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('content')
  const [activeTocId, setActiveTocId] = useState<string>()

  const { data: document, isLoading, isError } = useLegalDocumentDetail(id)

  const handleTocItemClick = (tocId: string) => {
    setActiveTocId(tocId)
    const el = window.document.getElementById(tocId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background-primary'>
        <div className='container py-6'>
          <div className='grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6'>
            <LegalDetailSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !document) {
    return (
      <div className='min-h-screen bg-background-primary flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <AlertCircle className='h-12 w-12 text-error-primary mx-auto' />
          <h2 className='text-h4 font-bold text-text-primary'>Không tìm thấy văn bản</h2>
          <p className='text-text-tertiary text-small'>Văn bản pháp luật bạn tìm không tồn tại hoặc đã bị xóa.</p>
          <Button onClick={() => navigate('/law-library')} iconStart={<ArrowLeft className='h-4 w-4' />}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background-primary'>
      <div className='border-b border-border-primary bg-background-primary py-5'>
        <div className='container'>
          <LegalDocumentHeader document={document} />
        </div>
      </div>

      <div className='container py-6'>
        <div className='border-b border-border-primary mb-6'>
          <LegalDocumentTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {activeTab === 'content' && (
          <div className='flex gap-6 items-start'>
            <div className='flex-1 min-w-0'>
              <div className='bg-background-primary rounded-xl border border-border-primary p-6 lg:p-8'>
                <LegalContentViewer
                  content={document.content}
                  onSectionChange={setActiveTocId}
                  className='legal-doc-content'
                />
              </div>
            </div>
            <aside className='hidden lg:block w-72 xl:w-80 shrink-0 sticky top-6'>
              <LegalTableOfContents
                items={MOCK_TOC}
                activeId={activeTocId}
                onItemClick={handleTocItemClick}
              />
            </aside>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className='max-w-2xl'>
            <LegalMetadataPanel document={document} />
          </div>
        )}

        {activeTab === 'diagram' && (
          <div className='flex items-center justify-center py-24 text-center'>
            <div>
              <p className='text-text-tertiary font-medium'>Tính năng Lược đồ đang được phát triển</p>
              <p className='text-small text-text-tertiary mt-1'>Sẽ hiển thị sơ đồ quan hệ của văn bản</p>
            </div>
          </div>
        )}

        {activeTab === 'original' && (
          <div className='flex items-center justify-center py-24 text-center'>
            <div>
              <p className='text-text-tertiary font-medium'>Văn bản gốc đang được cập nhật</p>
              <p className='text-small text-text-tertiary mt-1'>Vui lòng thử lại sau</p>
            </div>
          </div>
        )}

        {activeTab === 'download' && (
          <div className='max-w-md space-y-3'>
            <h3 className='font-semibold text-text-primary mb-4'>Tải xuống văn bản</h3>
            {[
              { label: 'File PDF', ext: 'pdf', size: '2.3 MB' },
              { label: 'File DOCX', ext: 'docx', size: '1.8 MB' },
            ].map((file) => (
              <div key={file.ext} className='flex items-center justify-between p-4 border border-border-primary rounded-xl bg-background-primary'>
                <div>
                  <p className='text-sm font-medium text-text-primary'>{file.label}</p>
                  <p className='text-xs text-text-tertiary'>{file.size}</p>
                </div>
                <Button size='sm' variant='outline'>
                  Tải về
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
