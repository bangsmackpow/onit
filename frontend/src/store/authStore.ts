// frontend/src/store/authStore.ts
import { create } from 'zustand'
import axios from 'axios'

interface User {
  id: string
  tenantId: string
  email: string
  fullName: string
}

interface AuthStore {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null

  // Actions
  register: (tenantName: string, fullName: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setToken: (token: string) => void
  loadFromLocalStorage: () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  loading: false,
  error: null,

  register: async (tenantName, fullName, email, password) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        tenantName,
        fullName,
        email,
        password,
      })

      const { token, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      set({ token, user, loading: false })
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed'
      set({ error: message, loading: false })
      throw error
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      })

      const { token, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      set({ token, user, loading: false })
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed'
      set({ error: message, loading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },

  setToken: (token: string) => {
    set({ token })
    localStorage.setItem('token', token)
  },

  loadFromLocalStorage: () => {
    const token = localStorage.getItem('token')
    const userJson = localStorage.getItem('user')

    if (token && userJson) {
      const user = JSON.parse(userJson)
      set({ token, user })
    }
  },
}))
