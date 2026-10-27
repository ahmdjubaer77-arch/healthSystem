import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoaderCircle, Plus, ShieldCheck, ShieldX, TimerReset } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import { useAuth } from '../../context/AuthContext'
import {
  createHealthShare,
  getHealthShares,
  lookupHealthShareRecipient,
  revokeHealthShare,
} from '../../services/api'

const timelineCategories = [
  ['MEDICAL_RECORD', 'Medical records'],
  ['PRESCRIPTION', 'Prescriptions'],
  ['REPORT', 'Reports'],
  ['DOCTOR_VISIT', 'Doctor visits'],
  ['HOSPITAL_VISIT', 'Hospital visits'],
  ['VACCINATION', 'Vaccinations'],
  ['HEALTH_PROBLEM', 'Health problems'],
  ['CURRENT_MEDICINE', 'Current medicines'],
  ['DOCTOR_CONSULTATION', 'Doctor consultations'],
  ['CHECKUP_REPORT', 'Checkup reports'],
]
const documentCategories = [
  ['PRESCRIPTION', 'Prescription files'],
  ['MEDICAL_REPORT', 'Medical report files'],
]
function formatDate(value) {
  if (!value) return 'No expiry'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

function scopeLabel(scope) {
  if (scope.resourceType === 'PROFILE') return 'Health profile'
  const options = scope.resourceType === 'TIMELINE' ? timelineCategories : documentCategories
  const label = options.find(([value]) => value === scope.category)?.[1] || scope.category
  return scope.resourceIds.length
    ? `${label} (${scope.resourceIds.length} selected)`
    : `${label} category`
}

function ConsentManager({ accessToken, records = [], documents = [], onSharingChanged }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(true)
  const [recipientLoading, setRecipientLoading] = useState(false)
  const recipientLookupInFlight = useRef(false)
  const [saving, setSaving] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [recipientPublicUserId, setRecipientPublicUserId] = useState('')
  const [recipient, setRecipient] = useState(null)
  const [expiresAt, setExpiresAt] = useState('')
  const [selections, setSelections] = useState({})
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [confirmingRevoke, setConfirmingRevoke] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const recordsByCategory = useMemo(() => {
    const groups = new Map()
    records.forEach((record) => {
      const category = record.recordType || 'UNCLASSIFIED'
      groups.set(category, [...(groups.get(category) || []), record])
    })
    return groups
  }, [records])

  const documentsByCategory = useMemo(() => {
    const groups = new Map()
    documents.forEach((document) => {
      groups.set(document.type, [...(groups.get(document.type) || []), document])
    })
    return groups
  }, [documents])

  const loadShares = async () => {
    setLoading(true)
    setError('')
    try {
      setShares(await getHealthShares(accessToken))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShares()
  }, [accessToken])

  const searchRecipient = async () => {
    if (recipientLookupInFlight.current) return
    const publicUserId = recipientPublicUserId.trim().toUpperCase()
    if (!/^BDH-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(publicUserId)) {
      setRecipient(null)
      setFormError('Enter a valid Custom User ID, such as BDH-7K9P2X4M.')
      return
    }

    recipientLookupInFlight.current = true
    setRecipientLoading(true)
    setFormError('')
    setRecipient(null)
    try {
      const account = await lookupHealthShareRecipient(accessToken, publicUserId)
      setRecipient({ ...account, publicUserId })
    } catch (lookupError) {
      if (lookupError.status === 401) {
        window.sessionStorage.setItem('bdh_auth_notice', lookupError.code || 'AUTH_REQUIRED')
        logout()
        navigate('/login', { replace: true, state: { from: '/health' } })
        return
      }
      setFormError(lookupError.message)
    } finally {
      recipientLookupInFlight.current = false
      setRecipientLoading(false)
    }
  }

  const toggle = (key) => {
    setSelections((current) => ({ ...current, [key]: !current[key] }))
  }

  const buildScopes = () => {
    const scopes = []
    if (selections.PROFILE) scopes.push({ resourceType: 'PROFILE', category: 'PROFILE', resourceIds: [] })

    for (const [resourceType, categories] of [['TIMELINE', timelineCategories], ['DOCUMENT', documentCategories]]) {
      const categoryOptions = categories.map(([value]) => value)
      for (const category of categoryOptions) {
        if (selections[`CATEGORY:${resourceType}:${category}`]) {
          scopes.push({ resourceType, category, resourceIds: [] })
          continue
        }
        const selectedRecords = resourceType === 'TIMELINE'
          ? (recordsByCategory.get(category) || [])
          : (documentsByCategory.get(category) || [])
        const resourceIds = selectedRecords
          .filter((record) => selections[`RECORD:${resourceType}:${record.id}`])
          .map((record) => record.id)
        if (resourceIds.length) scopes.push({ resourceType, category, resourceIds })
      }

      if (resourceType === 'TIMELINE') {
        const unclassifiedIds = (recordsByCategory.get('UNCLASSIFIED') || [])
          .filter((record) => selections[`RECORD:TIMELINE:${record.id}`])
          .map((record) => record.id)
        if (unclassifiedIds.length) scopes.push({ resourceType, category: 'UNCLASSIFIED', resourceIds: unclassifiedIds })
      }
    }
    return scopes
  }

  const submitShare = async (event) => {
    event.preventDefault()
    const scopes = buildScopes()
    if (!recipient) {
      setFormError('Find and confirm the recipient using their Custom User ID.')
      return
    }
    if (!scopes.length) {
      setFormError('Select at least one profile, category, or individual record.')
      return
    }
    if (!consentConfirmed) {
      setFormError('Confirm your consent before granting read-only access.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      await createHealthShare(accessToken, {
        recipientPublicUserId: recipient.publicUserId,
        scopes,
        expiresAt: expiresAt ? `${expiresAt}T23:59:59.999Z` : null,
        consentConfirmed,
      })
      setShareOpen(false)
      setRecipientPublicUserId('')
      setRecipient(null)
      setExpiresAt('')
      setSelections({})
      setConsentConfirmed(false)
      await loadShares()
      onSharingChanged?.()
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const onRevoke = async (shareId) => {
    setError('')
    try {
      await revokeHealthShare(accessToken, shareId)
      setConfirmingRevoke('')
      await loadShares()
      onSharingChanged?.()
    } catch (revokeError) {
      setError(revokeError.message)
    }
  }

  const renderResourceOptions = (resourceType, categories, availableRecords) => (
    <div className="space-y-3">
      {categories.map(([category, label]) => {
        const matchingRecords = availableRecords.get(category) || []
        const categoryKey = `CATEGORY:${resourceType}:${category}`
        return (
          <div key={`${resourceType}-${category}`} className="rounded-xl border border-white/10 bg-slate-950/20 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-100">
              <input
                type="checkbox"
                checked={Boolean(selections[categoryKey])}
                onChange={() => toggle(categoryKey)}
                className="accent-cyan-400"
              />
              All {label.toLowerCase()}
              <span className="text-xs text-slate-400">(including future records in this category)</span>
            </label>
            {matchingRecords.length > 0 && (
              <div className="mt-3 space-y-2 border-l border-white/10 pl-4">
                {matchingRecords.map((record) => {
                  const key = `RECORD:${resourceType}:${record.id}`
                  return (
                    <label key={record.id} className="flex items-start gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(selections[key])}
                        disabled={Boolean(selections[categoryKey])}
                        onChange={() => toggle(key)}
                        className="mt-0.5 accent-cyan-400"
                      />
                      <span>{record.title || record.originalFileName || label} · {formatDate(record.createdAt || record.date)}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      {resourceType === 'TIMELINE' && (availableRecords.get('UNCLASSIFIED') || []).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3">
          <p className="mb-2 text-sm font-medium text-slate-100">Unclassified timeline records</p>
          {(availableRecords.get('UNCLASSIFIED') || []).map((record) => (
            <label key={record.id} className="flex items-start gap-2 py-1 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(selections[`RECORD:TIMELINE:${record.id}`])}
                onChange={() => toggle(`RECORD:TIMELINE:${record.id}`)}
                className="mt-0.5 accent-cyan-400"
              />
              <span>{record.title} · {formatDate(record.date)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Consent & sharing</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Sharing and consent</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setShareOpen((open) => !open); setFormError('') }}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
        >
          <Plus size={16} />
          {shareOpen ? 'Close form' : 'Grant read-only access'}
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}

      {shareOpen && (
        <form onSubmit={submitShare} className="mb-6 space-y-5 rounded-2xl border border-cyan-300/20 bg-slate-950/30 p-4 sm:p-5">
          <div>
            <h3 className="text-lg font-semibold text-white">Create a new consent</h3>
            <p className="mt-1 text-sm text-slate-300">Find the intended account using its Custom User ID. The ID is resolved securely on the server.</p>
          </div>

          <div>
            <label htmlFor="share-recipient-public-id" className="block text-sm text-slate-200">Recipient Custom User ID</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="share-recipient-public-id"
                type="text"
                autoComplete="off"
                maxLength={12}
                value={recipientPublicUserId}
                onChange={(event) => {
                  setRecipientPublicUserId(event.target.value.toUpperCase())
                  setRecipient(null)
                  setFormError('')
                }}
                placeholder="BDH-7K9P2X4M"
                disabled={recipientLoading || saving}
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-slate-900 px-3 py-2.5 font-mono tracking-wider text-white placeholder:text-slate-500 focus:border-cyan-300/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={searchRecipient}
                disabled={recipientLoading || saving || !recipientPublicUserId.trim()}
                aria-busy={recipientLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-50"
              >
                {recipientLoading && <LoaderCircle size={15} className="animate-spin" />}
                Find account
              </button>
            </div>
            {recipient && (
              <p className="mt-2 rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                Recipient confirmed: <strong>{recipient.name}</strong> · {recipient.maskedUserId}
              </p>
            )}
            {formError && <p role="alert" className="mt-2 rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{formError}</p>}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-white">Health profile</h4>
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
                <input type="checkbox" checked={Boolean(selections.PROFILE)} onChange={() => toggle('PROFILE')} className="accent-cyan-400" />
                Share health profile
              </label>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-white">Expires (optional)</h4>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2.5 text-white focus:border-cyan-300/60 focus:outline-none"
              />
              <p className="text-xs text-slate-400">Without an expiry date, access remains active until you revoke it.</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 font-medium text-white">Timeline categories and records</h4>
              {renderResourceOptions('TIMELINE', timelineCategories, recordsByCategory)}
            </div>
            <div>
              <h4 className="mb-3 font-medium text-white">Document categories and files</h4>
              {renderResourceOptions('DOCUMENT', documentCategories, documentsByCategory)}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            <input
              type="checkbox"
              checked={consentConfirmed}
              onChange={(event) => setConsentConfirmed(event.target.checked)}
              className="mt-0.5 accent-emerald-400"
            />
            I explicitly consent to give this provider read-only access to the selected information. I understand I can revoke it.
          </label>

          <button
            type="submit"
            disabled={saving || recipientLoading || !consentConfirmed}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <LoaderCircle size={15} className="animate-spin" />}
            Confirm consent and share
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-300"><LoaderCircle size={16} className="animate-spin" />Loading sharing permissions…</div>
      ) : shares.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4 text-sm text-slate-300">No sharing permissions have been created.</div>
      ) : (
        <div className="space-y-3">
          {shares.map((share) => (
            <article key={share.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{share.recipient.name}</h3>
                  <p className="mt-1 text-sm text-slate-300">{share.recipient.maskedUserId || 'Custom User ID unavailable'} · Read-only access</p>
                </div>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                  share.status === 'ACTIVE'
                    ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
                    : share.status === 'EXPIRED'
                      ? 'border-amber-300/30 bg-amber-400/10 text-amber-100'
                      : 'border-slate-300/20 bg-white/5 text-slate-300'
                }`}>
                  {share.status}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Granted</div>
                  <p className="mt-1 text-sm text-white">{formatDate(share.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Expires</div>
                  <p className="mt-1 text-sm text-white">{formatDate(share.expiresAt)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Last seen</div>
                  <p className="mt-1 text-sm text-white">{share.lastSeen ? formatDate(share.lastSeen) : 'No successful views'}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Shared information</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {share.scopes.map((scope, index) => (
                    <span key={`${scope.resourceType}-${scope.category}-${index}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                      {scopeLabel(scope)}
                    </span>
                  ))}
                </div>
              </div>
              {share.status === 'ACTIVE' && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {confirmingRevoke === share.id ? (
                    <>
                      <span className="text-sm text-red-100">Revoke this recipient’s access immediately?</span>
                      <button type="button" onClick={() => onRevoke(share.id)} className="rounded-full border border-red-300/30 bg-red-500/15 px-3 py-2 text-sm text-red-100 hover:bg-red-500/25">Confirm revoke</button>
                      <button type="button" onClick={() => setConfirmingRevoke('')} className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Cancel</button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingRevoke(share.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
                    >
                      <ShieldX size={14} />
                      Revoke access
                    </button>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400"><TimerReset size={13} />Owner-controlled consent</span>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        Only the selected account can read the scoped information. The recipient cannot change or share it onward.
      </div>
    </GlassCard>
  )
}

export default ConsentManager
