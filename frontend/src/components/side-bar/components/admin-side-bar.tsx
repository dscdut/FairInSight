import { useState } from 'react'

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

import isEqual from '@/core/configs/is-equal'
import { adminSidebarLinks } from '@/core/constants/general.const'
import { ROUTE } from '@/core/constants/path'
import { cn } from '@/core/lib/utils'
import useToggleSideBar from '@/core/store/features/sidebar'

export default function AdminSideBar() {
  const { t } = useTranslation('navBar')
  const location = useLocation()
  const { sidebarOpen, toggleSidebar } = useToggleSideBar()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const isActiveLink = (linkPath: string) => {
    const currentPath = location.pathname
    const routePath = `${ROUTE.ADMIN.ROOT}/${linkPath}`
    const dashboardPath = `${ROUTE.ADMIN.ROOT}/${ROUTE.ADMIN.DASHBOARD}`
    if (isEqual(currentPath, dashboardPath)) {
      return (
        isEqual(linkPath, ROUTE.ADMIN.DASHBOARD) ||
        isEqual(linkPath, ROUTE.ADMIN.ROOT) ||
        isEqual(linkPath, `${ROUTE.ADMIN.ROOT}/`)
      )
    }
    return isEqual(currentPath, routePath) || currentPath.startsWith(`${routePath}/`)
  }

  const toggleSubmenu = (menuTitle: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuTitle) ? prev.filter((title) => !isEqual(title, menuTitle)) : [...prev, menuTitle]
    )
  }

  const isSubmenuExpanded = (menuTitle: string) => expandedMenus.includes(menuTitle)

  return (
    <aside
      className={cn(
        'flex relative flex-col h-full bg-white border-r border-gray-200 shadow-xl transition-all duration-500 md:flex dark:bg-gray-900 dark:border-gray-700',
        sidebarOpen ? 'w-72' : 'w-20'
      )}
      aria-label='Admin Sidebar navigation'
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700',
          !sidebarOpen && 'justify-center'
        )}
      >
        {sidebarOpen && (
          <div className='flex gap-3 items-center'>
            <div className='flex justify-center items-center w-10 h-10 bg-gradient-to-br from-primary to-primary-400 rounded-xl shadow-lg'>
              <Crown className='w-6 h-6 text-white' />
            </div>
            <div className='flex flex-col'>
              <h1 className='text-lg font-bold text-gray-900 dark:text-white'>AdminPanel</h1>
              <p className='text-xs text-gray-500 dark:text-gray-400'>Management System</p>
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center justify-center w-8 h-8 transition-all duration-300 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 group dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:border-gray-500',
            !sidebarOpen && 'w-10 h-10'
          )}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className='w-4 h-4 text-gray-600 transition-colors group-hover:text-gray-800 dark:text-gray-300 dark:group-hover:text-white' />
          ) : (
            <ChevronRight className='w-5 h-5 text-gray-600 transition-colors group-hover:text-gray-800 dark:text-gray-300 dark:group-hover:text-white' />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          'overflow-y-auto flex-1 py-6 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-600',
          sidebarOpen ? 'px-4' : 'px-3'
        )}
        role='navigation'
      >
        {adminSidebarLinks.map((link, index) => (
          <div key={link.title} className='space-y-1'>
            {/* Main Menu Item */}
            {link.children ? (
              <button
                onClick={() => toggleSubmenu(link.title)}
                className={cn(
                  'w-full flex items-center gap-4 rounded-xl text-small font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 group relative overflow-hidden',
                  sidebarOpen ? 'px-4 py-3.5' : 'px-3 py-3.5 justify-center',
                  isActiveLink(link.path)
                    ? 'bg-gradient-to-r from-primary to-primary-400 text-white shadow-lg shadow-primary/25 transform scale-[1.02]'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 hover:shadow-lg hover:transform hover:scale-[1.02] dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                )}
                title={!sidebarOpen ? t(link.titleKey || link.title) : undefined}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Active indicator */}
                {isActiveLink(link.path) && (
                  <div className='absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-primary to-primary-400 rounded-r-full' />
                )}

                {/* Icon */}
                <span
                  className={cn(
                    'flex-shrink-0 transition-all duration-300 relative z-10',
                    sidebarOpen ? 'w-5 h-5' : 'w-6 h-6',
                    isActiveLink(link.path)
                      ? 'text-white'
                      : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white'
                  )}
                >
                  {link.icon}
                </span>

                {/* Text and Chevron */}
                {sidebarOpen && (
                  <>
                    <span
                      className={cn(
                        'flex-1 text-left transition-all duration-300 relative z-10 truncate',
                        isActiveLink(link.path)
                          ? 'text-white'
                          : 'text-gray-600 group-hover:text-gray-800 dark:text-gray-300 dark:group-hover:text-white'
                      )}
                    >
                      {t(link.titleKey || link.title)}
                    </span>
                    <span
                      className={cn(
                        'transition-all duration-300 relative z-10',
                        isActiveLink(link.path)
                          ? 'text-white'
                          : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white'
                      )}
                    >
                      {isSubmenuExpanded(link.title) ? (
                        <ChevronUp className='w-4 h-4' />
                      ) : (
                        <ChevronDown className='w-4 h-4' />
                      )}
                    </span>
                  </>
                )}

                {/* Hover effect background */}
                <div
                  className={cn(
                    'absolute inset-0 bg-primary/10 transition-all duration-300 rounded-xl',
                    isActiveLink(link.path) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                />

                {/* Tooltip for collapsed state */}
                {!sidebarOpen && (
                  <div className='absolute left-full invisible z-50 px-3 py-2 ml-3 text-sm text-white whitespace-nowrap bg-gray-800 rounded-lg border border-gray-600 shadow-xl opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:visible dark:bg-gray-700 dark:border-gray-600'>
                    {t(link.titleKey || link.title)}
                    <div className='absolute left-0 top-1/2 w-2 h-2 bg-gray-800 border-b border-l border-gray-600 transform rotate-45 -translate-x-1 -translate-y-1/2 dark:bg-gray-700 dark:border-gray-600'></div>
                  </div>
                )}
              </button>
            ) : (
              <Link
                to={`${ROUTE.ADMIN.ROOT}/${link.path}`}
                className={cn(
                  'flex items-center gap-4 rounded-xl text-small transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 group relative overflow-hidden',
                  sidebarOpen ? 'px-4 py-3.5' : 'px-3 py-3.5 justify-center',
                  isActiveLink(link.path)
                    ? 'bg-gradient-to-r from-primary to-primary-400 text-white shadow-lg shadow-primary/25 transform scale-[1.02]'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 hover:shadow-lg hover:transform hover:scale-[1.02] dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                )}
                title={!sidebarOpen ? t(link.titleKey || link.title) : undefined}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Active indicator */}
                {isActiveLink(link.path) && (
                  <div className='absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-primary to-primary-400 rounded-r-full' />
                )}

                {/* Icon */}
                <span
                  className={cn(
                    'flex-shrink-0 transition-all duration-300 relative z-10',
                    sidebarOpen ? 'w-5 h-5' : 'w-6 h-6',
                    isActiveLink(link.path)
                      ? 'text-white'
                      : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white'
                  )}
                >
                  {link.icon}
                </span>

                {/* Text */}
                {sidebarOpen && (
                  <span
                    className={cn(
                      'transition-all duration-300 relative z-10 truncate',
                      isActiveLink(link.path)
                        ? 'text-white'
                        : 'text-gray-600 group-hover:text-gray-800 dark:text-gray-300 dark:group-hover:text-white'
                    )}
                  >
                    {t(link.titleKey || link.title)}
                  </span>
                )}

                {/* Hover effect background */}
                <div
                  className={cn(
                    'absolute inset-0 bg-primary/10 transition-all duration-300 rounded-xl',
                    isActiveLink(link.path) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                />

                {/* Tooltip for collapsed state */}
                {!sidebarOpen && (
                  <div className='absolute left-full invisible z-50 px-3 py-2 ml-3 text-sm text-white whitespace-nowrap bg-gray-800 rounded-lg border border-gray-600 shadow-xl opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:visible dark:bg-gray-700 dark:border-gray-600'>
                    {t(link.titleKey || link.title)}
                    <div className='absolute left-0 top-1/2 w-2 h-2 bg-gray-800 border-b border-l border-gray-600 transform rotate-45 -translate-x-1 -translate-y-1/2 dark:bg-gray-700 dark:border-gray-600'></div>
                  </div>
                )}
              </Link>
            )}

            {/* Submenu */}
            {link.children && sidebarOpen && isSubmenuExpanded(link.title) && (
              <div className='ml-6 space-y-1 duration-300 animate-in slide-in-from-top-2'>
                {link.children.map((child, childIndex) => (
                  <Link
                    key={child.title}
                    to={`${ROUTE.ADMIN.ROOT}/${child.path}`}
                    className={cn(
                      'm-2 flex items-center gap-3 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 group relative overflow-hidden',
                      'px-3 py-2.5 pl-8',
                      isActiveLink(child.path)
                        ? 'bg-primary/10 text-primary border-l-2 border-primary dark:text-primary'
                        : 'text-tertiary hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                    )}
                    style={{ animationDelay: `${index * 50 + childIndex * 25}ms` }}
                  >
                    <span className='truncate'>{t(child.titleKey || child.title)}</span>

                    {/* Active indicator for submenu */}
                    {isActiveLink(child.path) && (
                      <div className='absolute top-0 bottom-0 left-0 w-0.5 bg-gradient-to-b from-primary to-primary-400 rounded-r-full' />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          'border-t border-gray-200 transition-all duration-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
          sidebarOpen ? 'p-4' : 'p-3'
        )}
      >
        {sidebarOpen ? (
          <div className='flex gap-3 items-center'>
            <div className='flex justify-center items-center w-8 h-8 bg-gradient-to-br from-success-primary to-primary-400 rounded-full'>
              <div className='w-4 h-4 bg-white rounded-full animate-pulse' />
            </div>
            <div className='flex-1'>
              <p className='text-xs font-medium text-gray-700 dark:text-white'>{t('system_status')}</p>
              <p className='text-xs text-success-secondary'>{t('online_secure')}</p>
            </div>
          </div>
        ) : (
          <div className='flex justify-center'>
            <div className='flex justify-center items-center w-6 h-6 bg-gradient-to-br from-success-primary to-primary-400 rounded-full'>
              <div className='w-2 h-2 bg-white rounded-full animate-pulse' />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
