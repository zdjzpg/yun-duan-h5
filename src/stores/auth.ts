import { defineStore } from 'pinia'
import type { GetUserTokenResult, GetUserTokenUser } from '@/api/account'
import { getUserToken } from '@/api/account'

export interface AuthState {
  token: string | null
  user: GetUserTokenUser | null
  loading: boolean
  loaded: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
    loading: false,
    loaded: false,
  }),
  actions: {
    async ensureLogin(): Promise<void> {
      if (this.loaded && this.token && this.user) return
      if (this.loading) return

      this.loading = true
      this.loaded = true

      try {
        const result: GetUserTokenResult = await getUserToken()

        if (result && result.token && result.user) {
          this.token = result.token
          this.user = result.user

          try {
            localStorage.setItem('token', result.token)
          } catch {
            // ignore storage errors
          }
        } else {
          this.token = null
          this.user = null
        }
      } catch {
        this.token = null
        this.user = null
      } finally {
        this.loading = false
      }
    },
  },
})

