import { useState, useEffect } from 'react'

import {
  Search, UserX, ShieldAlert, ShieldCheck, UserCog, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react'

import {
  Button, Input, Badge, Avatar, AvatarImage, AvatarFallback, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { getInitials } from '@/core/helpers/get-initials'
import { cn } from '@/core/lib/utils'
import {
  useUsers,
  useDeleteUser,
  useBanUser,
  useUnbanUser,
  useUpdateUserRole
} from '@/hooks/users/use-users'
import { type UserItem } from '@/models/user/interfaces'
import { type UserStatus, type UserRole } from '@/models/user/types'

import { BanDialog } from './components/banDialog'
import { DeleteDialog } from './components/deleteDialog'
import { RoleDialog } from './components/roleDialog'
import { UnBanDialog } from './components/unBanDialog'

export default function UsersPage() {
  // Query filters & Pagination state
  const [searchVal, setSearchVal] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('Tất cả')
  const [selectedStatus, setSelectedStatus] = useState<string>('Tất cả')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<string>('fullName')

  // Checkbox row selection states
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  // Dialog control states
  const [targetUser, setTargetUser] = useState<UserItem | null>(null)
  const [dialogReason, setDialogReason] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseIssuer, setLicenseIssuer] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('USER')

  // Active dialog identifier
  const [activeDialog, setActiveDialog] = useState<'ban' | 'unban' | 'delete' | 'role' | null>(null)

  // Automatic search query debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchVal)
      setCurrentPage(1)
    }, 450)
    return () => clearTimeout(handler)
  }, [searchVal])

  // Fetch users data
  const { data, isLoading, isError, error, refetch } = useUsers({
    page: currentPage,
    size: itemsPerPage,
    search: searchQuery,
    roleName: selectedRole,
    status: selectedStatus
  })

  // Action mutations
  const deleteMutation = useDeleteUser()
  const banMutation = useBanUser()
  const unbanMutation = useUnbanUser()
  const updateRoleMutation = useUpdateUserRole()

  const handleRoleChangeSelect = (val: string) => {
    setSelectedRole(val)
    setCurrentPage(1)
  }

  const handleStatusChangeTab = (status: string) => {
    setSelectedStatus(status)
    setCurrentPage(1)
  }

  // Open specific action modal
  const openActionDialog = (user: UserItem, type: 'ban' | 'unban' | 'delete' | 'role') => {
    setTargetUser(user)
    setDialogReason('')
    setNewRole(user.roleName)
    setLicenseNumber('')
    setLicenseIssuer('')
    setActiveDialog(type)
  }

  const closeDialog = () => {
    setActiveDialog(null)
    setTargetUser(null)
  }

  // Submit operations
  const handleConfirmBan = async () => {
    if (!targetUser) return
    try {
      await banMutation.mutateAsync({
        id: targetUser.id,
        reason: dialogReason || 'Khóa tài khoản bởi quản trị viên'
      })
      closeDialog()
    } catch {
      // Mutation handles Toast errors
    }
  }

  const handleConfirmUnban = async () => {
    if (!targetUser) return
    try {
      await unbanMutation.mutateAsync({
        id: targetUser.id,
        reason: dialogReason || 'Kích hoạt tài khoản bởi quản trị viên'
      })
      closeDialog()
    } catch {
      // Mutation handles Toast errors
    }
  }

  const handleConfirmDelete = async () => {
    if (!targetUser) return
    try {
      await deleteMutation.mutateAsync(targetUser.id)
      closeDialog()
    } catch {
      // Mutation handles Toast errors
    }
  }

  const handleConfirmRoleUpdate = async () => {
    if (!targetUser) return
    if (newRole === 'LAWYER' && (!licenseNumber.trim() || !licenseIssuer.trim())) {
      return // Ensure license info is provided for lawyers
    }

    try {
      await updateRoleMutation.mutateAsync({
        id: targetUser.id,
        data: {
          role: newRole,
          licenseNumber: newRole === 'LAWYER' ? licenseNumber : '',
          licenseIssuer: newRole === 'LAWYER' ? licenseIssuer : ''
        }
      })
      closeDialog()
    } catch {
      // Mutation handles Toast errors
    }
  }

  // Export action handler
  const handleExport = () => {
    import('@/core/lib/toastify-common').then((m) => {
      m.default.success('Xuất dữ liệu người dùng thành công (CSV)')
    })
  }

  // Checkbox row toggles
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(usersList.map((u) => u.id))
    } else {
      setSelectedUserIds([])
    }
  }

  const handleSelectUser = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds((prev) => [...prev, id])
    } else {
      setSelectedUserIds((prev) => prev.filter((userId) => userId !== id))
    }
  }

  // Status Tab List
  const statusTabs = [
    { label: 'Tất cả', value: 'Tất cả' },
    { label: 'Hoạt động', value: 'active' },
    { label: 'Chờ kích hoạt', value: 'inactive' },
    { label: 'Đã khóa', value: 'banned' }
  ]

  const usersList = data?.data?.items || []
  const pagination = data?.data?.pagination
  const totalCount = pagination?.total || 0
  const totalPages = pagination?.totalPages || 1

  // Client-side sorting on users list
  const sortedUsersList = [...usersList].sort((a, b) => {
    if (sortBy === 'fullName') {
      return (a.fullName || '').localeCompare(b.fullName || '')
    }
    if (sortBy === 'email') {
      return (a.email || '').localeCompare(b.email || '')
    }
    if (sortBy === 'roleName') {
      return (a.roleName || '').localeCompare(b.roleName || '')
    }
    if (sortBy === 'status') {
      const statusA = a.status || ''
      const statusB = b.status || ''
      return statusA.localeCompare(statusB)
    }
    return 0
  })

  const isAllSelected = usersList.length > 0 && selectedUserIds.length === usersList.length

  // Custom role label formatter
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên'
      case 'LAWYER':
        return 'Luật sư'
      case 'MODERATOR':
        return 'Kiểm duyệt viên'
      case 'USER':
        return 'Người dùng'
      default:
        return role
    }
  }

  return (
    <main className='p-2 md:p-6 space-y-6 min-h-screen animate-in fade-in slide-in-from-bottom-2 duration-300'>
      {/* Top Header Section - Clean & Uncluttered Layout */}
      <section className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-2'>
        <div>
          <h1 className='text-h3 text-main'>
            Quản lý người dùng
          </h1>
          <p className='text-text-description mt-1 max-w-xl'>
            Phân quyền thành viên, kiểm duyệt trạng thái và quản lý tài khoản người dùng của FairInsights.
          </p>
        </div>

        {/* Integrated Quick Filter Tools in the Header */}
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-4 min-w-[280px] lg:min-w-[480px]'>
          <div className='relative flex-1'>
            <Input
              placeholder='Tìm kiếm người dùng...'
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              icon={<Search className='w-4 h-4 text-text-tertiary' />}
              iconOnClick={() => setSearchQuery(searchVal)}
            />
          </div>
          <div className='w-full sm:w-[155px]'>
            <Select value={selectedRole} onValueChange={handleRoleChangeSelect}>
              <SelectTrigger className='w-full border-border-secondary h-[46px] rounded-xl px-4 text-sm bg-background-primary hover:bg-background-secondary/40 transition-all focus:ring-0 focus:ring-offset-0 font-medium'>
                <SelectValue placeholder='Vai trò' />
              </SelectTrigger>
              <SelectContent className='bg-background-primary'>
                <SelectItem className='hover:bg-background-secondary cursor-pointer' value='Tất cả'>Tất cả vai trò</SelectItem>
                <SelectItem className='hover:bg-background-secondary cursor-pointer' value='ADMIN'>Quản trị viên</SelectItem>
                <SelectItem className='hover:bg-background-secondary cursor-pointer' value='LAWYER'>Luật sư</SelectItem>
                <SelectItem className='hover:bg-background-secondary cursor-pointer' value='MODERATOR'>Kiểm duyệt viên</SelectItem>
                <SelectItem className='hover:bg-background-secondary cursor-pointer' value='USER'>Người dùng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Clean Tab-Style Status Filters (Matching reference image) */}
      <section className='space-x-8 bg-transparent border-b border-secondary rounded-none h-auto p-0'>
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => handleStatusChangeTab(tab.value)}
              className={cn(
                "text-small font-medium text-text-description transition-all duration-200 pb-2 rounded-none border-b-2 border-transparent bg-transparent shadow-none",
                "hover:text-info",
                "data-[state=active]:border-b-info",
                "data-[state=active]:bg-transparent",
                "data-[state=active]:shadow-none",
                "dark:text-info dark:data-[state=active]:text-info dark:data-[state=active]:border-info",
                isActive
                  ? 'text-info border-info'
                  : 'text-text-description hover:text-text-primary border-transparent'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </section>

      {/* Table Top Toolbar (Faithful to the generated mockup design) */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <span className='text-sm text-text-description whitespace-nowrap'>
            Tổng số: <strong className='text-primary font-semibold'>{totalCount}</strong> người dùng
          </span>
          <div className='h-4 w-px bg-border-secondary' />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className='border-none shadow-none bg-transparent text-primary text-sm p-0 font-medium gap-1.5 focus:ring-0 focus:ring-offset-0 hover:text-primary/80 h-auto cursor-pointer'>
                <span className='text-text-main'>Sắp xếp:</span>
                <SelectValue placeholder='Chọn trường' />
              </SelectTrigger>
              <SelectContent className='bg-background-primary'>
                <SelectItem value='fullName' className='hover:bg-background-secondary cursor-pointer'>Tên (A-Z)</SelectItem>
                <SelectItem value='email' className='hover:bg-background-secondary cursor-pointer'>Email</SelectItem>
                <SelectItem value='roleName' className='hover:bg-background-secondary cursor-pointer'>Vai trò</SelectItem>
                <SelectItem value='status' className='hover:bg-background-secondary cursor-pointer'>Trạng thái</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Right Controls: Limit selector, page indicator, Arrow buttons, Export action */}
          <div className='flex items-center flex-wrap gap-2 sm:justify-end'>
            <div className='flex items-center gap-1.5 text-sm text-text-description'>
              <Select value={String(itemsPerPage)} onValueChange={(val) => {
                setItemsPerPage(Number(val))
                setCurrentPage(1)
              }}>
              <SelectTrigger className='border-none shadow-none bg-transparent text-primary text-sm font-medium p-0 gap-1.5 focus:ring-0 focus:ring-offset-0 hover:text-primary/80 h-auto cursor-pointer'>
                  <SelectValue />
                </SelectTrigger>
              <SelectContent className='bg-background-primary'>
                  <SelectItem className='hover:bg-background-secondary cursor-pointer' value='5'>5 / trang</SelectItem>
                  <SelectItem className='hover:bg-background-secondary cursor-pointer' value='10'>10 / trang</SelectItem>
                  <SelectItem className='hover:bg-background-secondary cursor-pointer' value='20'>20 / trang</SelectItem>
                  <SelectItem className='hover:bg-background-secondary cursor-pointer' value='30'>30 / trang</SelectItem>
                  <SelectItem className='hover:bg-background-secondary cursor-pointer' value='50'>50 / trang</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='h-4 w-px bg-border-secondary/60 hidden sm:block' />

            {/* Pager */}
            <div className='flex items-center gap-3.5'>
              <span className='text-sm font-medium text-text-description whitespace-nowrap'>
                Trang {currentPage} / {totalPages}
              </span>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className='w-4 h-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  <ChevronRight className='w-4 h-4' />
                </Button>
              </div>
            </div>

            <div className='h-4 w-px bg-border-secondary/60 hidden sm:block' />

            <div className='flex items-center gap-2'>
              <Button
                onClick={handleExport}
              >
                <span>Xuất file</span>
                <ChevronDown className='w-3.5 h-3.5' />
              </Button>
            </div>
          </div>
        </div>
      {/* Main Table Card (Single framing element, high contrast) */}
      <section className='bg-transparent rounded-sm border border-border-secondary shadow-sm overflow-hidden flex flex-col'>
        {/* User List Table */}
        {isLoading ? (
          <LoadingSpinner/>
        ) : isError ? (
          <div className='flex flex-col items-center justify-center text-error-primary gap-3 py-24 min-h-[350px]'>
            <AlertTriangle className='w-10 h-10' />
            <span className='text-sm font-bold'>Đã xảy ra lỗi khi tải dữ liệu</span>
            <p className='text-xs text-text-description'>
              {error instanceof Error ? error.message : 'Vui lòng kiểm tra lại kết nối và tải lại trang.'}
            </p>
            <Button onClick={() => refetch()} variant='outline' size='sm' className='mt-2 rounded-xl active:scale-[0.97] transition-all'>
              Thử lại
            </Button>
          </div>
        ) : (
          <div className='w-full overflow-x-auto'>
            <table className='w-full min-w-[1100px] border-collapse text-left text'>
              <thead className='bg-background-secondary border-b border-border-secondary'>
                <tr>
                  <th scope='col' className='pl-4 pr-1 px-2 py-4 w-[40px] text-center'>
                    <input
                      type='checkbox'
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className='w-4 h-4 rounded border-border-secondary text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary shadow-sm'
                    />
                  </th>
                  <th scope='col' className='p-2'>Người dùng</th>
                  <th scope='col' className='p-2'>Email</th>
                  <th scope='col' className='p-2'>Số điện thoại</th>
                  <th scope='col' className='p-2'>Mã người dùng</th>
                  <th scope='col' className='p-2 text-center'>Trạng thái</th>
                  <th scope='col' className='p-2 text-center'>Thao tác</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border-secondary/40'>
                {sortedUsersList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className='px-4 py-24 text-center text-text-tertiary font-medium'>
                      Không tìm thấy người dùng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  sortedUsersList.map((user) => {
                    // Custom status badge styles
                    const statusStyles = {
                      ACTIVE: {
                        label: 'Hoạt động',
                        class: 'text-success-primary'
                      },
                      INACTIVE: {
                        label: 'Chờ kích hoạt',
                        class: 'text-warning-primary'
                      },
                      BANNED: {
                        label: 'Đã khóa',
                        class: 'text-error-primary'
                      }
                    }

                    const userStatus = (user.status || 'INACTIVE').toUpperCase() as UserStatus
                    const currentStatusConfig = statusStyles[userStatus]
                    const isSelected = selectedUserIds.includes(user.id)

                    return (
                      <tr
                        key={user.id}
                        className={cn(
                          'hover:bg-background-secondary/15 transition-all duration-200 border-b border-border-secondary/40',
                          isSelected && 'bg-primary/5 hover:bg-primary/8 bg-opacity-70'
                        )}
                      >
                        {/* Checkbox column */}
                        <td className='pl-4 pr-1 py-2 text-center'>
                          <input
                            type='checkbox'
                            checked={isSelected}
                            onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                            className='w-4 h-4 rounded border-border-secondary text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary'
                          />
                        </td>

                        {/* Name & Avatar with Role subtitle column */}
                        <td className='px-4 py-2'>
                          <div className='flex items-center gap-3.5'>
                            <Avatar className='h-11 w-11 border border-border-secondary'>
                              <AvatarImage src={user.avatar || undefined} alt={user.fullName} />
                              <AvatarFallback className='text-primary font-bold text-sm uppercase'>
                                {user.fullName ? getInitials(user.fullName) : 'US'}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex flex-col gap-0.5'>
                              <span className='font-semibold text-text-main text-sm'>
                                {user.fullName}
                              </span>
                              <span className='text-xs text-text-description font-medium'>
                                {getRoleLabel(user.roleName)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email column */}
                        <td className='p-2 text-text-main text-sm font-medium'>
                          {user.email}
                        </td>

                        {/* Phone column */}
                        <td className='p-2 text-text-main text-sm font-medium'>
                          {user.phone || '—'}
                        </td>

                        {/* userCode (Mã người dùng) column */}
                        <td className='p-2 text-text-main text-sm font-medium'>
                          {user.userCode || user.id.slice(0, 8).toUpperCase()}
                        </td>

                        {/* Status (Trạng thái) column */}
                        <td className='px-4 py-2 text-center'>
                          <Badge
                            variant='outline'
                            className={cn(
                              'text-sm font-medium px-2 py-2 tracking-wide border-none',
                              currentStatusConfig.class
                            )}
                          >
                            {currentStatusConfig.label}
                          </Badge>
                        </td>

                        {/* Actions (Thao tác) column */}
                        <td className='p-2'>
                          <div className='flex items-center justify-center gap-2'>
                            {/* Edit Role */}
                            <Button
                              size='icon'
                              variant='ghost'
                              className='h-8 w-8 text-info hover:bg-info-50 active:scale-[0.97] transition-all'
                              title='Thay đổi vai trò'
                              onClick={() => openActionDialog(user, 'role')}
                            >
                              <UserCog className='w-4 h-4' />
                            </Button>

                            {/* Ban / Unban toggler */}
                            {user.status?.toUpperCase() === 'BANNED' ? (
                              <Button
                                size='icon'
                                variant='ghost'
                                className='h-8 w-8 text-success-primary'
                                title='Mở khóa tài khoản'
                                onClick={() => openActionDialog(user, 'unban')}
                              >
                                <ShieldCheck className='w-4 h-4' />
                              </Button>
                            ) : (
                              <Button
                                className="h-8 w-8 text-warning-primary"
                                size='icon'
                                variant='ghost'
                                title='Khóa tài khoản'
                                onClick={() => openActionDialog(user, 'ban')}
                              >
                                <ShieldAlert className='w-4 h-4' />
                              </Button>
                            )}

                            {/* Delete */}
                            <Button
                              className="h-8 w-8 text-error-primary"
                              size='icon'
                              variant='ghost'
                              title='Xóa tài khoản'
                              onClick={() => openActionDialog(user, 'delete')}
                            >
                              <UserX className='w-4 h-4' />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ban Account Dialog */}
      <BanDialog
        isOpen={activeDialog === 'ban'}
        onClose={closeDialog}
        targetUser={targetUser}
        reason={dialogReason}
        onReasonChange={setDialogReason}
        onConfirm={handleConfirmBan}
        isPending={banMutation.isPending}
      />

      {/* Unban Account Dialog */}
      <UnBanDialog
        isOpen={activeDialog === 'unban'}
        onClose={closeDialog}
        targetUser={targetUser}
        reason={dialogReason}
        onReasonChange={setDialogReason}
        onConfirm={handleConfirmUnban}
        isPending={unbanMutation.isPending}
      />

      {/* Delete User Dialog */}
      <DeleteDialog
        isOpen={activeDialog === 'delete'}
        onClose={closeDialog}
        targetUser={targetUser}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />

      {/* Update Role Dialog */}
      <RoleDialog
        isOpen={activeDialog === 'role'}
        onClose={closeDialog}
        targetUser={targetUser}
        newRole={newRole}
        onRoleChange={setNewRole}
        licenseNumber={licenseNumber}
        onLicenseNumberChange={setLicenseNumber}
        licenseIssuer={licenseIssuer}
        onLicenseIssuerChange={setLicenseIssuer}
        onConfirm={handleConfirmRoleUpdate}
        isPending={updateRoleMutation.isPending}
      />
    </main>
  )
}
