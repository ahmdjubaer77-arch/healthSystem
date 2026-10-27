import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, loginUser } from '../services/api'
import { getJwtExpirationTime } from '../utils/jwt-expiry'

const AuthContext = createContext(null)
const STORAGE_KEY = 'bdh_auth_session'
const LEGACY_DEMO_STORAGE_KEY = 'bdh_demo_auth_user'

const getSavedSession = () => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    window.localStorage.removeItem(LEGACY_DEMO_STORAGE_KEY)
    const saved = window.localStorage.getItem(STORAGE_KEY)
      || window.sessionStorage.getItem(STORAGE_KEY)
    const session = saved ? JSON.parse(saved) : null

    if (!session?.user || !session?.accessToken) {
      window.localStorage.removeItem(STORAGE_KEY)
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }

    return session
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSavedSession())
  const user = session?.user ?? null
  const accessToken = session?.accessToken ?? null

  useEffect(() => {
    if (!accessToken) return undefined

    let isCurrent = true
    const expiresAt = getJwtExpirationTime(accessToken)
    const expirationTimer = expiresAt === null
      ? undefined
      : window.setTimeout(() => {
        if (!isCurrent) return
        setSession((currentSession) => (
          currentSession?.accessToken === accessToken ? null : currentSession
        ))

        for (const storage of [window.localStorage, window.sessionStorage]) {
          const savedSession = storage.getItem(STORAGE_KEY)
          if (!savedSession) continue
          try {
            if (JSON.parse(savedSession)?.accessToken === accessToken) {
              storage.removeItem(STORAGE_KEY)
            }
          } catch {
            storage.removeItem(STORAGE_KEY)
          }
        }
        window.sessionStorage.setItem('bdh_auth_notice', 'SESSION_EXPIRED')
      }, Math.max(0, expiresAt - Date.now()))

    getCurrentUser(accessToken)
      .then((profile) => {
        if (!isCurrent || !profile) return
        setSession((currentSession) => ({
          ...currentSession,
          user: { ...currentSession.user, ...profile },
        }))
      })
      .catch((error) => {
        if (!isCurrent || error.status !== 401) return
        setSession(null)
        window.localStorage.removeItem(STORAGE_KEY)
        window.sessionStorage.removeItem(STORAGE_KEY)
        window.sessionStorage.setItem('bdh_auth_notice', error.code || 'AUTH_REQUIRED')
      })

    return () => {
      isCurrent = false
      if (expirationTimer !== undefined) window.clearTimeout(expirationTimer)
    }
  }, [accessToken])

  const persistSession = (nextSession, rememberMe) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
      window.sessionStorage.removeItem(STORAGE_KEY)
      const storage = rememberMe ? window.localStorage : window.sessionStorage
      storage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    }
    return nextSession
  }

  const login = async ({ email, password, rememberMe }) => {
    const normalizedEmail = (email || '').trim()

    if (!normalizedEmail || !password) {
      throw new Error('Please enter your email and password.')
    }

    const data = await loginUser({ email: normalizedEmail, password })
    const nextSession = { user: data.user, accessToken: data.accessToken }

    setSession(persistSession(nextSession, rememberMe))
    return data.user
  }

  const updateProfilePicture = (nextProfile) => {
    if (!user) return null

    return updateProfile({ profilePicture: nextProfile?.profilePicture ?? null })
  }

  const updateProfile = (nextProfile) => {
    const merged = {
      ...user,
      ...nextProfile,
    }
    const nextSession = { ...session, user: merged }
    const rememberMe = typeof window !== 'undefined'
      && window.localStorage.getItem(STORAGE_KEY) !== null

    setSession(persistSession(nextSession, rememberMe))
    return merged
  }

  const logout = () => {
    setSession(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
      window.sessionStorage.removeItem(STORAGE_KEY)
      window.localStorage.removeItem(LEGACY_DEMO_STORAGE_KEY)
    }
  }

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      login,
      logout,
      updateProfile,
      updateProfilePicture,
    }),
    [user, accessToken, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
