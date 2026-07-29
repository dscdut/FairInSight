import { useQuery } from '@tanstack/react-query'

import type { LegalDocumentFilters } from '../types'
import { legalService } from '../services/legalService'

export function useLegalDocuments(filters: LegalDocumentFilters) {
  return useQuery({
    queryKey: ['legal-documents', filters],
    queryFn: () => legalService.getDocuments(filters),
    placeholderData: (prev) => prev,
  })
}

export function useLegalDocumentDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['legal-document', id],
    queryFn: () => legalService.getDocumentById(id!),
    enabled: !!id,
  })
}
