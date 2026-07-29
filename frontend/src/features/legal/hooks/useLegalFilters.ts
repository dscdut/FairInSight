import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { DocumentStatus, DocumentType, IssuingAgency, LegalField, LegalDocumentFilters, SortOption } from '../types'
import { DEFAULT_FILTERS } from '../constants'

export function useLegalFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: LegalDocumentFilters = useMemo(
    () => ({
      search: searchParams.get('search') || DEFAULT_FILTERS.search,
      field: (searchParams.get('field') as LegalField) || DEFAULT_FILTERS.field,
      status: (searchParams.get('status') as DocumentStatus | 'all') || DEFAULT_FILTERS.status,
      documentType: (searchParams.get('documentType') as DocumentType | 'all') || DEFAULT_FILTERS.documentType,
      issuingAgency: (searchParams.get('issuingAgency') as IssuingAgency | 'all') || DEFAULT_FILTERS.issuingAgency,
      fromDate: searchParams.get('fromDate') || DEFAULT_FILTERS.fromDate,
      toDate: searchParams.get('toDate') || DEFAULT_FILTERS.toDate,
      sort: (searchParams.get('sort') as SortOption) || DEFAULT_FILTERS.sort,
      page: Number(searchParams.get('page')) || DEFAULT_FILTERS.page,
      pageSize: Number(searchParams.get('pageSize')) || DEFAULT_FILTERS.pageSize,
    }),
    [searchParams]
  )

  const updateFilter = useCallback(
    <K extends keyof LegalDocumentFilters>(key: K, value: LegalDocumentFilters[K]) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value === '' || value === 'all' || value === DEFAULT_FILTERS[key as keyof typeof DEFAULT_FILTERS]) {
          next.delete(key)
        } else {
          next.set(key, String(value))
        }
        if (key !== 'page') next.set('page', '1')
        return next
      })
    },
    [setSearchParams]
  )

  const resetFilters = useCallback(() => {
    setSearchParams({})
  }, [setSearchParams])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.field !== 'all') count++
    if (filters.status !== 'all') count++
    if (filters.documentType !== 'all') count++
    if (filters.issuingAgency !== 'all') count++
    if (filters.fromDate) count++
    if (filters.toDate) count++
    return count
  }, [filters])

  return { filters, updateFilter, resetFilters, activeFilterCount }
}
