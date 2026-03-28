// frontend/src/lib/apiClient.ts
import axios, { AxiosInstance, AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_URL = '/api'

let apiClient: AxiosInstance

export function initializeApiClient() {
  apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Attach auth token to every request
  apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  // Handle errors and token expiration
  apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }

      return Promise.reject(error)
    }
  )

  return apiClient
}

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    initializeApiClient()
  }
  return apiClient
}

// ============================================================================
// Convenience methods
// ============================================================================

export async function apiGet<T = any>(url: string, config?: any) {
  return getApiClient().get<T>(url, config)
}

export async function apiPost<T = any>(url: string, data?: any, config?: any) {
  return getApiClient().post<T>(url, data, config)
}

export async function apiPut<T = any>(url: string, data?: any, config?: any) {
  return getApiClient().put<T>(url, data, config)
}

export async function apiDelete<T = any>(url: string, config?: any) {
  return getApiClient().delete<T>(url, config)
}
