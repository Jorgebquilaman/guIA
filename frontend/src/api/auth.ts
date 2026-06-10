import { useMutation } from '@tanstack/react-query'
import apiClient from './client'
import type { ApiResponse, LoginResponse } from '../types'

interface LoginRequest {
  email: string
  password: string
}

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data)
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Login failed')
      }
      return res.data.data
    },
  })
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: async (refreshToken: string) => {
      const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh', { refreshToken })
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Token refresh failed')
      }
      return res.data.data
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const res = await apiClient.post<ApiResponse<null>>('/auth/change-password', data)
      if (!res.data.success) {
        throw new Error(res.data.error?.message ?? 'Password change failed')
      }
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email })
      return res.data
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const res = await apiClient.post<ApiResponse<null>>('/auth/reset-password', data)
      if (!res.data.success) {
        throw new Error(res.data.error?.message ?? 'Password reset failed')
      }
    },
  })
}

export function useRequestAccess() {
  return useMutation({
    mutationFn: async (data: { email: string; fullName: string }) => {
      const res = await apiClient.post<ApiResponse<null>>('/auth/request-access', data)
      if (!res.data.success) {
        throw new Error(res.data.error?.message ?? 'Request failed')
      }
      return res.data
    },
  })
}
