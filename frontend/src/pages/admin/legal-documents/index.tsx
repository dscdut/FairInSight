import { useState, useEffect, useCallback } from 'react'

import { Award, Loader2 } from 'lucide-react'

import { FadeUp } from '@/components/animated/animated-component'
import { Button } from '@/components/ui/button'
import { cn } from '@/core/lib/utils'
import { lawApi } from '@/core/services/law.service'
import { type Law, type LawVersion } from '@/models/types/law.type'

import { DocumentDetailDrawer } from './components/document-detail-drawer'
import { DocumentFilters } from './components/document-filters'
import { DocumentFormDrawer } from './components/document-form-drawer'
import { DocumentListTable } from './components/document-list-table'
import { StatusChangeModal } from './components/status-change-modal'

export default function LegalDocumentsPage() {
  const [laws, setLaws] = useState<Law[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [issuedDateFilter, setIssuedDateFilter] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Modals & Drawers state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeLawForForm, setActiveLawForForm] = useState<Law | null>(null)

  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeLawForDetail, setActiveLawForDetail] = useState<Law | null>(null)

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [activeLawForStatus, setActiveLawForStatus] = useState<Law | null>(null)

  // Fetch Laws from API
  const fetchLaws = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await lawApi.listLaws({
        page: currentPage,
        size: itemsPerPage,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        issuedDate: issuedDateFilter || undefined
      })
      setLaws(res.items)
      setTotalPages(res.pagination.totalPages)
      setTotalCount(res.pagination.total)
    } catch (error) {
      console.error('Lỗi khi tải danh sách văn bản:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery, statusFilter, issuedDateFilter])

  useEffect(() => {
    fetchLaws()
  }, [fetchLaws])

  // Handlers
  const handleAddNewClick = () => {
    setActiveLawForForm(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (law: Law) => {
    setActiveLawForForm(law)
    setIsFormOpen(true)
  }

  const handleViewClick = async (law: Law) => {
    try {
      const res = await lawApi.getLawById(law.id)
      setActiveLawForDetail(res)
      setIsDetailOpen(true)
    } catch (error) {
      console.error('Lỗi khi tải chi tiết văn bản:', error)
    }
  }

  const handleToggleStatusClick = (law: Law) => {
    setActiveLawForStatus(law)
    setIsStatusModalOpen(true)
  }

  // Handle Create or Update submission
  const handleFormSubmit = async (formData: {
    title: string
    documentNumber: string
    issuedDate: string
    effectiveDate: string
    sourceUrl: string
    officialUrl: string
    content: string
    changeNote: string
  }) => {
    try {
      if (activeLawForForm) {
        // UPDATE (Edit)
        await lawApi.updateLaw(activeLawForForm.id, {
          title: formData.title,
          documentNumber: formData.documentNumber,
          issuedDate: formData.issuedDate,
          effectiveDate: formData.effectiveDate,
          sourceUrl: formData.sourceUrl,
          officialUrl: formData.officialUrl,
          content: formData.content,
          changeNote: formData.changeNote
        })
      } else {
        // CREATE (Add New)
        await lawApi.createLaw({
          title: formData.title,
          documentNumber: formData.documentNumber,
          issuedDate: formData.issuedDate,
          effectiveDate: formData.effectiveDate,
          sourceUrl: formData.sourceUrl,
          officialUrl: formData.officialUrl,
          content: formData.content
        })
      }
      setIsFormOpen(false)
      fetchLaws()
    } catch (error) {
      console.error('Lỗi khi lưu văn bản:', error)
      alert('Không thể lưu văn bản. Vui lòng thử lại.')
    }
  }

  // Handle Confirming status change
  const handleStatusConfirm = async (law: Law, reason: string) => {
    try {
      const nextStatus = law.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await lawApi.toggleStatus(law.id, {
        status: nextStatus,
        reason
      })
      setIsStatusModalOpen(false)
      fetchLaws()
      
      // Update details drawer if open
      if (activeLawForDetail && activeLawForDetail.id === law.id) {
        const detailRes = await lawApi.getLawById(law.id)
        setActiveLawForDetail(detailRes)
      }
    } catch (error) {
      console.error('Lỗi khi đổi trạng thái hiệu lực:', error)
      alert('Không thể đổi trạng thái hiệu lực.')
    }
  }

  // Handle restoring a previous version
  const handleRestoreVersion = async (version: LawVersion) => {
    try {
      await lawApi.restoreVersion(version.lawId, version.id)
      alert(`Đã khôi phục thành công văn bản về phiên bản ${version.version.toUpperCase()}`)
      fetchLaws()

      // Refresh detail modal
      if (activeLawForDetail && activeLawForDetail.id === version.lawId) {
        const detailRes = await lawApi.getLawById(version.lawId)
        setActiveLawForDetail(detailRes)
      }
    } catch (error) {
      console.error('Lỗi khi phục hồi phiên bản:', error)
      alert('Lỗi khi khôi phục phiên bản.')
    }
  }

  // Handle saving a new version from inline edit
  const handleSaveNewVersion = async (lawId: string, content: string, changeNote: string, sourceUrl?: string) => {
    try {
      if (!activeLawForDetail) return
      await lawApi.updateLaw(lawId, {
        title: activeLawForDetail.title,
        documentNumber: activeLawForDetail.documentNumber,
        issuedDate: activeLawForDetail.issuedDate,
        effectiveDate: activeLawForDetail.effectiveDate,
        sourceUrl: sourceUrl || activeLawForDetail.sourceUrl,
        officialUrl: activeLawForDetail.officialUrl || '',
        content,
        changeNote: changeNote || 'Cập nhật phiên bản mới'
      })
      fetchLaws()

      // Refresh details drawer
      const detailRes = await lawApi.getLawById(lawId)
      setActiveLawForDetail(detailRes)
    } catch (error) {
      console.error('Lỗi khi lưu phiên bản mới:', error)
      alert('Không thể lưu phiên bản mới.')
    }
  }

  return (
    <main className='space-y-6 flex-1 flex flex-col'>
      {/* Title section */}
      <section>
        <FadeUp>
          <span className='inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm mb-3.5'>
            <Award className='w-3.5 h-3.5' />
            Hệ thống Quản lý Pháp lý
          </span>
          <h1 className='text-h1 font-bold text-text-primary mb-2'>
            Quản lý văn bản pháp luật
          </h1>
          <p className='text-xs text-text-description font-semibold leading-relaxed'>
            Cập nhật và điều chỉnh các văn bản pháp quy trong hệ thống.
          </p>
        </FadeUp>
      </section>

      {/* Filter box and Table */}
      <section className='border border-border-secondary bg-background-primary rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 relative min-h-[350px]'>
        <DocumentFilters
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val)
            setCurrentPage(1)
          }}
          statusFilter={statusFilter}
          onStatusChange={(val) => {
            setStatusFilter(val)
            setCurrentPage(1)
          }}
          issuedDateFilter={issuedDateFilter}
          onIssuedDateChange={(val) => {
            setIssuedDateFilter(val)
            setCurrentPage(1)
          }}
          onAddNewClick={handleAddNewClick}
        />

        {isLoading ? (
          <div className='flex-1 flex flex-col items-center justify-center text-text-tertiary gap-2 min-h-[250px]'>
            <Loader2 className='w-8 h-8 text-primary animate-spin' />
            <span className='text-xs font-semibold'>Đang tải dữ liệu văn bản...</span>
          </div>
        ) : (
          <>
            <DocumentListTable
              laws={laws}
              onView={handleViewClick}
              onEdit={handleEditClick}
              onToggleStatus={handleToggleStatusClick}
            />

            {/* Table Pagination */}
            {totalCount > itemsPerPage && (
              <div className='flex items-center justify-between p-5 bg-background-primary border-t border-border-secondary rounded-b-2xl mt-auto'>
                <p className='text-xs text-text-description font-semibold'>
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, totalCount)} của {totalCount} văn bản
                </p>
                <div className='flex gap-2.5'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className='h-8 px-3 text-xs border-border-primary text-text-primary font-bold hover:bg-background-secondary transition-all rounded-xl'
                  >
                    Trước
                  </Button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <Button
                      key={idx}
                      size='sm'
                      onClick={() => setCurrentPage(idx + 1)}
                      variant={currentPage === idx + 1 ? 'default' : 'outline'}
                      className={cn(
                        'h-8 w-8 text-xs font-bold rounded-xl transition-all',
                        currentPage === idx + 1 ? 'text-white' : 'text-text-primary border-border-primary'
                      )}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className='h-8 px-3 text-xs border-border-primary text-text-primary font-bold hover:bg-background-secondary transition-all rounded-xl'
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Drawers and Modals */}
      <DocumentFormDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        law={activeLawForForm}
        onRestoreVersion={handleRestoreVersion}
      />

      <DocumentDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        law={activeLawForDetail}
        onRestoreVersion={handleRestoreVersion}
        onSaveNewVersion={handleSaveNewVersion}
      />

      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleStatusConfirm}
        law={activeLawForStatus}
      />
    </main>
  )
}
