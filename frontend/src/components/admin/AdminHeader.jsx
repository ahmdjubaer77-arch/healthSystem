import { Camera, Check, ImagePlus, Menu, Save, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { deleteProfilePicture, updateUserProfile, uploadProfilePicture } from '../../services/api'
import ProfileAvatar from '../common/ProfileAvatar'
import ThemeToggle from '../layout/ThemeToggle'

function AdminHeader({ onOpenMobileSidebar }) {
  const { user, accessToken, updateProfile } = useAuth()
  const profileMenuRef = useRef(null)
  const profilePictureInputRef = useRef(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [profilePicturePreview, setProfilePicturePreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!profileOpen) return undefined

    setProfileForm({ name: user?.name || '', phone: user?.phone || '' })

    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setProfileOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfileOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [profileOpen, user?.name, user?.phone])

  const handleProfileSave = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSuccess('')

    try {
      const updatedUser = await updateUserProfile(accessToken, {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || null,
      })
      updateProfile(updatedUser)
      setSuccess('Profile information updated.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to update profile information.')
    } finally {
      setBusy(false)
    }
  }

  const handlePictureChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WEBP image.')
      event.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile pictures must be 5 MB or smaller.')
      event.target.value = ''
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setProfilePicturePreview(previewUrl)
    setBusy(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('profilePicture', file)
      const updatedUser = await uploadProfilePicture(accessToken, formData)
      updateProfile(updatedUser)
      setSuccess('Profile picture updated.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to upload the profile picture.')
    } finally {
      URL.revokeObjectURL(previewUrl)
      setProfilePicturePreview('')
      setBusy(false)
      event.target.value = ''
    }
  }

  const handlePictureDelete = async () => {
    setBusy(true)
    setError('')
    setSuccess('')

    try {
      const updatedUser = await deleteProfilePicture(accessToken)
      updateProfile(updatedUser)
      setSuccess('Profile picture removed.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to remove the profile picture.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <header className="admin-topbar sticky top-3 z-30 mx-3 mt-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 shadow-lg shadow-slate-950/10 backdrop-blur-xl sm:mx-4 sm:px-6 lg:mx-6 lg:px-8">
      <div className="flex min-h-10 items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-controls="admin-mobile-navigation"
            aria-haspopup="dialog"
            className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:bg-white/10 lg:hidden"
            aria-label="Open admin navigation"
          >
            <Menu size={19} />
          </button>
          <div className="hidden sm:block">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Administration</p>
            <p className="mt-0.5 text-sm text-slate-300">Platform operations</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <ThemeToggle />
          <div ref={profileMenuRef} className="admin-profile-menu relative">
            <button
              type="button"
              onClick={() => {
                setError('')
                setSuccess('')
                setProfileOpen((open) => !open)
              }}
              aria-expanded={profileOpen}
              aria-controls="admin-profile-panel"
              aria-haspopup="dialog"
              aria-label="Open admin profile settings"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 p-0 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <ProfileAvatar user={user} size="md" className="h-10 w-10 rounded-full" />
            </button>

            {profileOpen && (
              <section
                id="admin-profile-panel"
                role="dialog"
                aria-label="Admin profile settings"
                className="admin-profile-panel absolute right-0 top-[calc(100%+0.75rem)] z-50 max-h-[calc(100dvh-6rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-white/10 bg-white p-4 text-slate-900 shadow-2xl sm:p-5"
              >
                <header className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Admin profile</p>
                    <p className="mt-0.5 text-xs text-slate-500">Update your account information</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                    aria-label="Close admin profile settings"
                  >
                    <X size={17} />
                  </button>
                </header>

                <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <ProfileAvatar user={user} size="lg" previewUrl={profilePicturePreview} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{user?.name || 'Administrator'}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => profilePictureInputRef.current?.click()}
                        disabled={busy}
                        className="admin-profile-photo-action inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                      >
                        <ImagePlus size={14} />
                        Change photo
                      </button>
                      {user?.profilePicture?.url && (
                        <button
                          type="button"
                          onClick={handlePictureDelete}
                          disabled={busy}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={profilePictureInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePictureChange}
                      className="sr-only"
                      aria-label="Choose profile picture"
                    />
                  </div>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-3">
                  <label className="block text-xs font-medium text-slate-600">
                    Full name
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(event) => setProfileForm((form) => ({ ...form, name: event.target.value }))}
                      minLength={2}
                      maxLength={100}
                      required
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-700"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    Phone number
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(event) => setProfileForm((form) => ({ ...form, phone: event.target.value }))}
                      maxLength={20}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-700"
                    />
                  </label>
                  <p className="text-[11px] leading-4 text-slate-500">
                    Email: {user?.email || 'Not available'} · Email changes are managed separately.
                  </p>

                  {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
                  {success && <p role="status" className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700"><Check size={14} />{success}</p>}

                  <button
                    type="submit"
                    disabled={busy}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {busy ? <Camera size={16} className="animate-pulse" /> : <Save size={16} />}
                    {busy ? 'Saving…' : 'Save changes'}
                  </button>
                </form>
              </section>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
