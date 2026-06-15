import { useState, useCallback } from 'react'

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

import { adminSidebarLinks } from '@/core/constants/general.const'
import { ROUTE } from '@/core/constants/path'
import { cn } from '@/core/lib/utils'
import useToggleSideBar from '@/core/store/features/sidebar'

export default function AdminSideBar() {
  const { t } = useTranslation('navBar')
  const location = useLocation()
  const { sidebarOpen, toggleSidebar } = useToggleSideBar()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const isActiveLink = useCallback((linkPath: string) => {
    const currentPath = location.pathname
    const routePath = `${ROUTE.ADMIN.ROOT}/${linkPath}`
    const dashboardPath = `${ROUTE.ADMIN.ROOT}/${ROUTE.ADMIN.DASHBOARD}`
    
    if (currentPath === dashboardPath) {
      return (
        linkPath === ROUTE.ADMIN.DASHBOARD ||
        linkPath === ROUTE.ADMIN.ROOT ||
        linkPath === `${ROUTE.ADMIN.ROOT}/`
      )
    }
    return currentPath === routePath || currentPath.startsWith(`${routePath}/`)
  }, [location.pathname])

  const toggleSubmenu = useCallback((menuTitle: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuTitle) 
        ? prev.filter((title) => title !== menuTitle) 
        : [...prev, menuTitle]
    )
  }, [])

  return (
    <aside
      className={cn(
        'flex relative flex-col h-full bg-background-primary border-r border-border-secondary shadow-xl transition-all duration-500 md:flex ',
        sidebarOpen ? 'w-72' : 'w-20'
      )}
      aria-label='Admin Sidebar navigation'
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b border-border-secondary',
          !sidebarOpen && 'justify-center'
        )}
      >
        {sidebarOpen && (
          <div className='flex gap-3 items-center animate-in fade-in duration-300'>
            <div className='flex justify-center items-center w-10 h-10 bg-gradient-to-br from-primary to-primary-400 rounded-xl shadow-lg'>
              <Crown className='w-6 h-6 text-white' />
            </div>
            <div className='flex flex-col'>
              <h1 className='text-lg font-bold text-primary'>AdminPanel</h1>
              <p className='text-xs text-text-description'>Management System</p>
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center justify-center w-8 h-8 transition-all duration-300 bg-background-secondary border border-border-secondary rounded-lg hover:bg-background-third hover:border-border-primary group',
            !sidebarOpen && 'w-10 h-10'
          )}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className='w-4 h-4 text-main transition-colors group-hover:text-main' />
          ) : (
            <ChevronRight className='w-5 h-5 text-main transition-colors group-hover:text-main' />
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
        {adminSidebarLinks.map((link, index) => {
          const isLinkActive = isActiveLink(link.path)
          const isExpanded = sidebarOpen && expandedMenus.includes(link.title)
          const menuText = t(link.titleKey || link.title)

          return (
            <div key={link.title} className='space-y-1'>
              {/* Main Menu Item */}
              {link.children ? (
                <button
                  onClick={() => toggleSubmenu(link.title)}
                  className={cn(
                    'w-full flex items-center gap-4 rounded-xl text-small font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 group relative overflow-hidden',
                    sidebarOpen ? 'px-4 py-3' : 'px-3 py-3 justify-center',
                    isLinkActive
                      ? 'bg-gradient-to-r from-primary to-primary-400 text-white font-bold shadow-lg shadow-primary/25 transform scale-[1.02]'
                      : 'text-text-description hover:text-text hover:bg-background-third hover:shadow-lg hover:transform hover:scale-[1.02]'
                  )}
                  title={!sidebarOpen ? menuText : undefined}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {isLinkActive && (
                    <div className='absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-primary to-primary-400 rounded-r-full' />
                  )}

                  <span
                    className={cn(
                      'flex-shrink-0 transition-all duration-300 relative z-10',
                      sidebarOpen ? 'w-5 h-5' : 'w-6 h-6',
                      isLinkActive
                        ? 'text-white'
                        : 'text-text-description group-hover:text-text'
                    )}
                  >
                    {link.icon}
                  </span>

                  {sidebarOpen && (
                    <>
                      <span
                        className={cn(
                          'flex-1 text-left transition-all duration-300 relative z-10 truncate',
                          isLinkActive
                            ? 'text-white'
                            : 'text-text-description group-hover:text-text'
                        )}
                      >
                        {menuText}
                      </span>
                      <span
                        className={cn(
                          'transition-all duration-300 relative z-10',
                          isLinkActive ? 'text-white' : 'text-text-description group-hover:text-text'
                        )}
                      >
                        {isExpanded ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
                      </span>
                    </>
                  )}

                  <div
                    className={cn(
                      'absolute inset-0 bg-primary/10 transition-all duration-300 rounded-xl',
                      isLinkActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    )}
                  />

                  {!sidebarOpen && (
                    <div className='absolute left-full invisible z-50 px-3 py-2 ml-3 text-sm text-white whitespace-nowrap bg-gray-800 rounded-lg border border-gray-600 shadow-xl opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:visible dark:bg-gray-700 dark:border-gray-600'>
                      {menuText}
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
                    isLinkActive
                      ? 'bg-gradient-to-r from-primary to-primary-400 text-white shadow-lg shadow-primary/25 transform scale-[1.02]'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 hover:shadow-lg hover:transform hover:scale-[1.02] dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                  )}
                  title={!sidebarOpen ? menuText : undefined}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {isLinkActive && (
                    <div className='absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-primary to-primary-400 rounded-r-full' />
                  )}

                  <span
                    className={cn(
                      'flex-shrink-0 transition-all duration-300 relative z-10',
                      sidebarOpen ? 'w-5 h-5' : 'w-6 h-6',
                      isLinkActive
                        ? 'text-white'
                        : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white'
                    )}
                  >
                    {link.icon}
                  </span>

                  {sidebarOpen && (
                    <span
                      className={cn(
                        'transition-all duration-300 relative z-10 truncate',
                        isLinkActive
                          ? 'text-white'
                          : 'text-gray-600 group-hover:text-gray-800 dark:text-gray-300 dark:group-hover:text-white'
                      )}
                    >
                      {menuText}
                    </span>
                  )}

                  <div
                    className={cn(
                      'absolute inset-0 bg-primary/10 transition-all duration-300 rounded-xl',
                      isLinkActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    )}
                  />

                  {!sidebarOpen && (
                    <div className='absolute left-full invisible z-50 px-3 py-2 ml-3 text-sm text-white whitespace-nowrap bg-gray-800 rounded-lg border border-primary shadow-xl opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:visible dark:bg-gray-700 dark:border-gray-600'>
                      {menuText}
                      <div className='absolute left-0 top-1/2 w-2 h-2 bg-gray-800 border-b border-l border-primary transform rotate-45 -translate-x-1 -translate-y-1/2 dark:bg-gray-700 dark:border-gray-600'></div>
                    </div>
                  )}
                </Link>
              )}

              {/* Submenu */}
              {isExpanded && link.children && (
                <div className='ml-6 space-y-1 duration-300 animate-in slide-in-from-top-2'>
                  {link.children.map((child, childIndex) => {
                    const isChildActive = isActiveLink(child.path)
                    return (
                      <Link
                        key={child.title}
                        to={`${ROUTE.ADMIN.ROOT}/${child.path}`}
                        className={cn(
                          'm-2 flex items-center gap-3 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary group relative overflow-hidden',
                          'px-3 py-2.5 pl-8',
                          isChildActive
                            ? 'bg-primary/10 text-primary border-l-2 border-primary dark:text-primary'
                            : 'text-tertiary hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                        )}
                        style={{ animationDelay: `${index * 50 + childIndex * 25}ms` }}
                      >
                        <span className='truncate'>{t(child.titleKey || child.title)}</span>
                        {isChildActive && (
                          <div className='absolute top-0 bottom-0 left-0 w-0.5 bg-gradient-to-b from-primary to-primary-400 rounded-r-full' />
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          'border-t border-gray-200 transition-all duration-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
          sidebarOpen ? 'p-4' : 'p-3'
        )}
      >
        <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
          <div className='flex justify-center items-center w-6 h-6 bg-gradient-to-br from-success-primary to-primary-400 rounded-full flex-shrink-0'>
            <div className='w-2 h-2 bg-white rounded-full animate-pulse' />
          </div>
          {sidebarOpen && (
            <div className='flex-1 min-w-0 animate-in fade-in duration-300'>
              <p className='text-xs font-medium text-gray-700 dark:text-white truncate'>{t('system_status')}</p>
              <p className='text-xs text-success-secondary truncate'>{t('online_secure')}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}