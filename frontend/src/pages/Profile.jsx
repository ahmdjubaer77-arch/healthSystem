import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Copy, Edit3, HeartPulse, ImagePlus, Save, ShieldCheck, Trash2, UserRound, X } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import GlassCard from '../components/common/GlassCard'
import LoadingState from '../components/common/LoadingState'
import ProfileAvatar from '../components/common/ProfileAvatar'
import SectionHeader from '../components/common/SectionHeader'
import { useAuth } from '../context/AuthContext'
import {
  deleteMyAccount,
  deleteProfilePicture,
  getHealthProfile,
  saveHealthProfile,
  updateUserProfile,
  uploadProfilePicture,
} from '../services/api'

function ProfileField({ id, label, onClear, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-200">{label}</label>
        {onClear && (
          <button type="button" onClick={onClear} className="text-xs font-medium text-cyan-200 transition hover:text-white">
            Clear
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function Profile() {
  const { user, accessToken, updateProfile, updateProfilePicture, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileInputRef = useRef(null)
  const [healthProfile, setHealthProfile] = useState(null)
  const [healthProfileLoading, setHealthProfileLoading] = useState(true)
  const [healthProfileError, setHealthProfileError] = useState('')
  const [healthProfileRetry, setHealthProfileRetry] = useState(0)
  const [profilePictureLoading, setProfilePictureLoading] = useState(false)
  const [profilePictureError, setProfilePictureError] = useState('')
  const [profilePicturePreview, setProfilePicturePreview] = useState('')
  const [editForm, setEditForm] = useState(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteAccountError, setDeleteAccountError] = useState('')
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false)
  const [publicIdCopied, setPublicIdCopied] = useState(false)
  const [publicIdCopyError, setPublicIdCopyError] = useState('')

  const copyPublicUserId = async () => {
    if (!user?.publicUserId) return
    try {
      await navigator.clipboard.writeText(user.publicUserId)
      setPublicIdCopied(true)
      setPublicIdCopyError('')
      window.setTimeout(() => setPublicIdCopied(false), 2000)
    } catch {
      setPublicIdCopyError('Unable to copy the ID. Select and copy it manually.')
    }
  }

  const startEditing = () => {
    setEditForm({
      name: user?.name || '',
      dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
      gender: user?.gender || '',
      district: user?.location?.district || '',
      area: user?.location?.area || '',
      bloodGroup: user?.bloodGroup || healthProfile?.bloodGroup || '',
      phone: user?.phone || '',
      emergencyName: healthProfile?.emergencyContact?.name || '',
      emergencyRelationship: healthProfile?.emergencyContact?.relationship || '',
      emergencyPhone: healthProfile?.emergencyContact?.phone || '',
    })
    setProfileError('')
  }

  useEffect(() => {
    if (searchParams.get('editProfile') !== '1' || healthProfileLoading) return
    startEditing()
    navigate('/profile', { replace: true })
  }, [healthProfileLoading, navigate, searchParams])

  useEffect(() => {
    let isCurrent = true

    setHealthProfileLoading(true)
    setHealthProfileError('')

    getHealthProfile(accessToken)
      .then((profile) => {
        if (isCurrent) setHealthProfile(profile)
      })
      .catch((error) => {
        if (isCurrent) setHealthProfileError(error.message)
      })
      .finally(() => {
        if (isCurrent) setHealthProfileLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [accessToken, healthProfileRetry])

  const emergencyContact = healthProfile?.emergencyContact
  const emergencyContactDetails = emergencyContact
    ? [emergencyContact.name, emergencyContact.relationship, emergencyContact.phone].filter(Boolean).join(' · ')
    : ''
  const healthLists = healthProfile && [
    ['Allergies', healthProfile.allergies],
    ['Existing conditions', healthProfile.existingConditions],
    ['Current medications', healthProfile.currentMedications],
    ['Family medical history', healthProfile.familyMedicalHistory],
  ]

  const updateEditField = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  const handleProfileSave = async (event) => {
    event.preventDefault()
    if (!editForm) return

    setProfileSaving(true)
    setProfileError('')
    try {
      const location = {
        ...(user?.location || {}),
        district: editForm.district.trim(),
        area: editForm.area.trim(),
      }
      const hasLocation = Object.values(location).some(
        (value) => typeof value === 'string' && value.trim(),
      )
      const updatedUser = await updateUserProfile(accessToken, {
        name: editForm.name.trim(),
        dateOfBirth: editForm.dateOfBirth || null,
        gender: editForm.gender || null,
        location: hasLocation ? location : null,
        bloodGroup: editForm.bloodGroup || null,
        phone: editForm.phone.trim() || null,
      })
      updateProfile(updatedUser)

      const emergencyContact = [
        editForm.emergencyName,
        editForm.emergencyRelationship,
        editForm.emergencyPhone,
      ].some((value) => value.trim())
        ? {
          name: editForm.emergencyName.trim(),
          relationship: editForm.emergencyRelationship.trim(),
          phone: editForm.emergencyPhone.trim(),
        }
        : null
      const updatedHealthProfile = await saveHealthProfile(
        accessToken,
        { bloodGroup: editForm.bloodGroup || '', emergencyContact },
        Boolean(healthProfile),
      )
      setHealthProfile(updatedHealthProfile)
      setEditForm(null)
    } catch (error) {
      setProfileError(error.message)
    } finally {
      setProfileSaving(false)
    }
  }

  const handleAccountDelete = async (event) => {
    event.preventDefault()
    setDeleteAccountLoading(true)
    setDeleteAccountError('')

    try {
      await deleteMyAccount(accessToken, deletePassword)
      logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setDeleteAccountError(error.message)
    } finally {
      setDeleteAccountLoading(false)
    }
  }

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfilePictureError('Choose a JPG, JPEG, PNG, or WEBP image.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfilePictureError('Profile pictures must be 5 MB or smaller.')
      event.target.value = ''
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setProfilePicturePreview(previewUrl)
    setProfilePictureLoading(true)
    setProfilePictureError('')

    try {
      const formData = new FormData()
      formData.append('profilePicture', file)
      const updatedUser = await uploadProfilePicture(accessToken, formData)
      updateProfilePicture(updatedUser)
      event.target.value = ''
    } catch (error) {
      setProfilePictureError(error.message)
    } finally {
      URL.revokeObjectURL(previewUrl)
      setProfilePicturePreview('')
      setProfilePictureLoading(false)
    }
  }

  const handleProfilePictureDelete = async () => {
    setProfilePictureLoading(true)
    setProfilePictureError('')

    try {
      const updatedUser = await deleteProfilePicture(accessToken)
      updateProfilePicture(updatedUser)
    } catch (error) {
      setProfilePictureError(error.message)
    } finally {
      setProfilePictureLoading(false)
    }
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Account"
        title="Profile dashboard"
        subtitle="Account details and health information associated with your profile."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <ProfileAvatar user={user} size="xl" previewUrl={profilePicturePreview} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Account</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{user?.name || 'Account user'}</h2>
              <p className="mt-1 text-sm text-slate-300">{user?.email || 'Email unavailable'}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleProfilePictureUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={profilePictureLoading}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus size={14} />
              {profilePictureLoading ? 'Updating...' : 'Upload photo'}
            </button>
            <button
              type="button"
              onClick={handleProfilePictureDelete}
              disabled={!user?.profilePicture || profilePictureLoading}
              className="inline-flex items-center gap-2 rounded-full border border-red-300/35 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={14} />
              Delete photo
            </button>
          </div>

          {profilePictureError && (
            <p className="mt-3 rounded-xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">
              {profilePictureError}
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-3 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Custom User ID</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-lg font-semibold tracking-wider text-cyan-100">
                  {user?.publicUserId || 'ID unavailable — refresh your profile'}
                </p>
                <button
                  type="button"
                  onClick={copyPublicUserId}
                  disabled={!user?.publicUserId}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Copy Custom User ID"
                >
                  {publicIdCopied ? <Check size={14} /> : <Copy size={14} />}
                  {publicIdCopied ? 'Copied' : 'Copy ID'}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">Share this ID only with people you intend to identify. It cannot be changed.</p>
              {publicIdCopyError && <p role="alert" className="mt-2 text-xs text-red-200">{publicIdCopyError}</p>}
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Phone</p>
              <p className="mt-2 text-sm font-medium text-white">{user?.phone || 'Not provided'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</p>
              <p className="mt-2 text-sm font-medium text-white">{user?.role || 'PATIENT'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Division</p>
              <p className="mt-2 text-sm font-medium text-white">{user?.location?.division || 'Not provided'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
              <p className="mt-2 text-sm font-medium text-emerald-200">Signed in</p>
            </div>
          </div>

          <button
            type="button"
            onClick={startEditing}
            disabled={healthProfileLoading || profileSaving}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Edit3 size={14} />
            Edit Profile
          </button>
          <div className="mt-5 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => {
                setDeleteAccountError('')
                setDeletePassword('')
                setDeleteAccountOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/60"
            >
              <Trash2 size={14} aria-hidden="true" />
              Delete account
            </button>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
                <UserRound size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Personal info</p>
                <h3 className="mt-2 text-xl font-semibold text-white">My information</h3>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Date of birth</p>
                <p className="mt-2 text-sm text-white">{user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Gender</p>
                <p className="mt-2 text-sm text-white">{user?.gender?.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()) || 'Not provided'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">District</p>
                <p className="mt-2 text-sm text-white">{user?.location?.district || 'Not provided'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Area</p>
                <p className="mt-2 text-sm text-white">{user?.location?.area || 'Not provided'}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
                <HeartPulse size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Health summary</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Quick profile</h3>
              </div>
            </div>

            {healthProfileLoading ? (
              <div className="mt-4">
                <LoadingState message="Loading health profile..." compact />
              </div>
            ) : healthProfileError ? (
              <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-4" role="alert">
                <p className="text-sm text-red-100">{healthProfileError}</p>
                <button
                  type="button"
                  onClick={() => setHealthProfileRetry((attempt) => attempt + 1)}
                  className="mt-3 text-sm font-semibold text-cyan-100 hover:text-white"
                >
                  Try again
                </button>
              </div>
            ) : !healthProfile ? (
              <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/20 p-4 text-sm text-slate-300">
                No health profile has been created yet.
              </p>
            ) : (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Emergency contact</p>
                    <p className="mt-2 text-sm text-white">{emergencyContactDetails || 'Not provided'}</p>
                  </div>
                  {healthLists.map(([label, items]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
                      <p className="mt-2 text-sm text-white">{items?.length ? items.join(', ') : 'None listed'}</p>
                    </div>
                  ))}
                  <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Emergency medical information</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white">
                      {healthProfile.emergencyMedicalInfo || 'Not provided'}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3">
              <div>
                <p className="text-sm font-medium text-white">View My Health</p>
                <p className="text-xs text-slate-400">High-level health summary</p>
              </div>
              <Link to="/health" className="inline-flex items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100">
                Open
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Privacy</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Emergency information</h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Emergency information is sensitive health information. Only share it when necessary. This is a demo page and not a real privacy control system.
            </p>
          </GlassCard>
        </div>
      </div>

      {editForm && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !profileSaving) setEditForm(null)
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onSubmit={handleProfileSave}
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[28px] border border-white/10 bg-slate-950/90 p-5 shadow-[0_24px_70px_rgba(2,8,23,0.5)] backdrop-blur-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Account</p>
                <h2 id="edit-profile-title" className="mt-2 text-2xl font-bold text-white">Edit profile</h2>
              </div>
              <button
                type="button"
                aria-label="Close edit profile"
                disabled={profileSaving}
                onClick={() => setEditForm(null)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ProfileField id="edit-name" label="Full name">
                <input
                  id="edit-name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={editForm.name}
                  onChange={(event) => updateEditField('name', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
                />
              </ProfileField>

              <ProfileField id="edit-date-of-birth" label="Date of birth" onClear={() => updateEditField('dateOfBirth', '')}>
                <input
                  id="edit-date-of-birth"
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(event) => updateEditField('dateOfBirth', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
                />
              </ProfileField>

              <ProfileField id="edit-gender" label="Gender" onClear={() => updateEditField('gender', '')}>
                <select
                  id="edit-gender"
                  value={editForm.gender}
                  onChange={(event) => updateEditField('gender', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
                >
                  <option value="">Not specified</option>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </ProfileField>

              <ProfileField id="edit-phone" label="Mobile number" onClear={() => updateEditField('phone', '')}>
                <input
                  id="edit-phone"
                  type="tel"
                  maxLength={20}
                  autoComplete="tel"
                  value={editForm.phone}
                  onChange={(event) => updateEditField('phone', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
                />
              </ProfileField>

              <ProfileField id="edit-district" label="District" onClear={() => updateEditField('district', '')}>
                <input
                  id="edit-district"
                  maxLength={100}
                  value={editForm.district}
                  onChange={(event) => updateEditField('district', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
                />
              </ProfileField>

              <ProfileField id="edit-area" label="Area" onClear={() => updateEditField('area', '')}>
                <input
                  id="edit-area"
                  maxLength={100}
                  value={editForm.area}
                  onChange={(event) => updateEditField('area', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
                />
              </ProfileField>

              <ProfileField id="edit-blood-group" label="Blood group" onClear={() => updateEditField('bloodGroup', '')}>
                <select
                  id="edit-blood-group"
                  value={editForm.bloodGroup}
                  onChange={(event) => updateEditField('bloodGroup', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
                >
                  <option value="">Not specified</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </ProfileField>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-white">Emergency contact</h3>
                <button
                  type="button"
                  onClick={() => setEditForm((current) => ({
                    ...current,
                    emergencyName: '',
                    emergencyRelationship: '',
                    emergencyPhone: '',
                  }))}
                  className="text-xs font-medium text-cyan-200 transition hover:text-white"
                >
                  Clear contact
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileField id="edit-emergency-name" label="Contact name" onClear={() => updateEditField('emergencyName', '')}>
                  <input
                    id="edit-emergency-name"
                    maxLength={100}
                    value={editForm.emergencyName}
                    onChange={(event) => updateEditField('emergencyName', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
                  />
                </ProfileField>
                <ProfileField id="edit-emergency-relationship" label="Relationship" onClear={() => updateEditField('emergencyRelationship', '')}>
                  <input
                    id="edit-emergency-relationship"
                    maxLength={60}
                    value={editForm.emergencyRelationship}
                    onChange={(event) => updateEditField('emergencyRelationship', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
                  />
                </ProfileField>
                <ProfileField id="edit-emergency-phone" label="Contact phone" onClear={() => updateEditField('emergencyPhone', '')}>
                  <input
                    id="edit-emergency-phone"
                    type="tel"
                    maxLength={20}
                    value={editForm.emergencyPhone}
                    onChange={(event) => updateEditField('emergencyPhone', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
                  />
                </ProfileField>
              </div>
            </div>

            {profileError && <p className="mt-4 rounded-xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">{profileError}</p>}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={profileSaving}
                onClick={() => setEditForm(null)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={15} aria-hidden="true" />
                {profileSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteAccountOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleteAccountLoading) setDeleteAccountOpen(false)
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onSubmit={handleAccountDelete}
            className="w-full max-w-md rounded-[28px] border border-red-300/20 bg-slate-950/95 p-5 shadow-[0_24px_70px_rgba(2,8,23,0.55)] sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-2xl border border-red-300/20 bg-red-500/10 p-2 text-red-200">
                <AlertTriangle size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 id="delete-account-title" className="text-xl font-semibold text-white">Delete your account?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  This permanently deletes your account, health profile, medical records, and submitted requests. Enter your current password to confirm.
                </p>
              </div>
            </div>

            <label htmlFor="delete-account-password" className="mt-5 block text-sm font-medium text-slate-200">Current password</label>
            <input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              required
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-red-300/40"
            />
            {deleteAccountError && <p className="mt-3 text-sm text-red-200" role="alert">{deleteAccountError}</p>}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={deleteAccountLoading}
                onClick={() => setDeleteAccountOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleteAccountLoading}
                className="rounded-full border border-red-300/30 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteAccountLoading ? 'Deleting...' : 'Permanently delete account'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Profile
