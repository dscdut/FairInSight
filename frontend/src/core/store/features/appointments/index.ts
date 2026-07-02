import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Attachment {
  name: string
  size: string
}

export interface AppointmentRequest {
  id: string
  lawyerName: string
  lawyerAvatar?: string
  date: string
  topicVI: string
  topicEN: string
  message: string
  status: 'pending' | 'confirmed' | 'rejected'
  attachments: Attachment[]
  rejectReason?: string
}

interface AppointmentState {
  requests: AppointmentRequest[]
  addRequest: (request: Omit<AppointmentRequest, 'id' | 'date' | 'status'>) => void
  cancelRequest: (id: string) => void
  updateRequestStatus: (id: string, status: 'confirmed' | 'rejected', rejectReason?: string) => void
}

const initialMockRequests: AppointmentRequest[] = []

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set) => ({
      requests: initialMockRequests,
      addRequest: (newReq) =>
        set((state) => {
          const id = `CR-${Math.floor(1000 + Math.random() * 9000)}`
          const date = new Date().toISOString().split('T')[0]
          const request: AppointmentRequest = {
            ...newReq,
            id,
            date,
            status: 'pending'
          }
          return {
            requests: [request, ...state.requests]
          }
        }),
      cancelRequest: (id) =>
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== id)
        })),
      updateRequestStatus: (id, status, rejectReason) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? { ...r, status, rejectReason } : r
          )
        }))
    }),
    {
      name: 'appointments-storage'
    }
  )
)
