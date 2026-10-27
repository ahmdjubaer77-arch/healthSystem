import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Download, Eye, FileText, LoaderCircle, ShieldCheck } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import MedicalDocumentViewer from './MedicalDocumentViewer'
import {
  getReceivedHealthShares,
  getSharedHealthDocuments,
  getSharedHealthProfile,
  getSharedHealthTimeline,
  getSharedMedicalDocumentContent,
} from '../../services/api'

function formatDate(value) {
  if (!value) return 'No expiry'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

function scopeLabel(scope) {
  if (scope.resourceType === 'PROFILE') return 'Health profile'
  const category = scope.category.toLowerCase().replace(/_/g, ' ')
  const count = scope.recordCount
  return count ? `${category} (${count} selected)` : `${category} category`
}

function displayValue(value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None recorded'
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([key, item]) => `${key}: ${item}`).join(' · ')
  }
  return value === null || value === undefined || value === '' ? 'Not provided' : String(value)
}

function SharedWithMe({ accessToken }) {
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedShareId, setExpandedShareId] = useState('')
  const [loadedContent, setLoadedContent] = useState({})
  const [loadingShareId, setLoadingShareId] = useState('')
  const [documentLoadingId, setDocumentLoadingId] = useState('')
  const [documentError, setDocumentError] = useState('')
  const [activeDocument, setActiveDocument] = useState(null)
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('')
  const inFlightShares = useRef(new Set())

  const loadShares = async () => {
    setLoading(true)
    setError('')
    try {
      setShares(await getReceivedHealthShares(accessToken))
    } catch (loadError) {
      setError(loadError.message || 'Unable to load health information shared with you.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShares()
  }, [accessToken])

  useEffect(() => () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl)
  }, [fileUrl])

  const openShare = async (share) => {
    if (expandedShareId === share.id) {
      setExpandedShareId('')
      return
    }
    setExpandedShareId(share.id)
    if (loadedContent[share.id] || inFlightShares.current.has(share.id)) return

    inFlightShares.current.add(share.id)
    setLoadingShareId(share.id)
    setError('')
    const scopeTypes = new Set(share.scopes.map((scope) => scope.resourceType))
    try {
      const [profile, timeline, documents] = await Promise.all([
        scopeTypes.has('PROFILE') ? getSharedHealthProfile(accessToken, share.id) : null,
        scopeTypes.has('TIMELINE')
          ? getSharedHealthTimeline(accessToken, share.id, { page: 1, limit: 50 })
          : null,
        scopeTypes.has('DOCUMENT')
          ? getSharedHealthDocuments(accessToken, share.id, { page: 1, limit: 50 })
          : null,
      ])
      setLoadedContent((current) => ({
        ...current,
        [share.id]: {
          profile,
          timeline: timeline?.records || [],
          documents: documents?.documents || [],
        },
      }))
    } catch (loadError) {
      if (loadError.status === 404) await loadShares()
      setError(loadError.message || 'Unable to load these shared records. Access may have been revoked.')
    } finally {
      inFlightShares.current.delete(share.id)
      setLoadingShareId('')
    }
  }

  const retrieveDocument = async (share, document, download = false) => {
    setDocumentLoadingId(document.id)
    setDocumentError('')
    try {
      const blob = await getSharedMedicalDocumentContent(accessToken, share.id, document.id)
      if (download) {
        const url = URL.createObjectURL(blob)
        const link = window.document.createElement('a')
        link.href = url
        link.download = document.originalFileName || document.title || 'shared-medical-document'
        window.document.body.appendChild(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        return
      }

      if (fileUrl) URL.revokeObjectURL(fileUrl)
      setFileType(blob.type || '')
      setFileUrl(URL.createObjectURL(blob))
      setActiveDocument(document)
    } catch (loadError) {
      setDocumentError(loadError.message || 'Unable to retrieve this shared document.')
      if (loadError.status === 404) await loadShares()
    } finally {
      setDocumentLoadingId('')
    }
  }

  const closeViewer = () => {
    setActiveDocument(null)
    setFileUrl('')
    setFileType('')
  }

  return (
    <>
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Recipient access</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Shared with me</h2>
          </div>
        </div>

        {error && <p role="alert" className="mb-4 rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
        {documentError && <p role="alert" className="mb-4 rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{documentError}</p>}
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-300">
            <LoaderCircle size={16} className="animate-spin" />Loading shared health information…
          </div>
        ) : shares.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4 text-sm text-slate-300">
            No active health information has been shared with this account.
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => {
              const content = loadedContent[share.id]
              const expanded = expandedShareId === share.id
              return (
                <article key={share.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{share.owner.name}</h3>
                      <p className="mt-1 text-sm text-slate-300">
                        {share.owner.maskedUserId || 'Custom User ID unavailable'} · Read-only access
                      </p>
                    </div>
                    <span className="w-fit rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                      ACTIVE
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Granted</div>
                      <p className="mt-1 text-sm text-white">{formatDate(share.createdAt)}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Expires</div>
                      <p className="mt-1 text-sm text-white">{formatDate(share.expiresAt)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {share.scopes.map((scope, index) => (
                      <span key={`${scope.resourceType}-${scope.category}-${index}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                        {scopeLabel(scope)}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => openShare(share)}
                    disabled={loadingShareId === share.id}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-50"
                  >
                    {loadingShareId === share.id
                      ? <LoaderCircle size={15} className="animate-spin" />
                      : expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    {loadingShareId === share.id ? 'Loading records…' : expanded ? 'Close shared records' : 'Open shared records'}
                  </button>

                  {expanded && content && (
                    <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                      {content.profile && (
                        <section>
                          <h4 className="font-semibold text-white">Shared health profile</h4>
                          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                            {Object.entries(content.profile).map(([key, value]) => (
                              <div key={key} className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                                <dt className="text-xs capitalize text-slate-400">{key.replace(/([A-Z])/g, ' $1')}</dt>
                                <dd className="mt-1 break-words text-sm text-slate-100">{displayValue(value)}</dd>
                              </div>
                            ))}
                          </dl>
                        </section>
                      )}

                      {content.timeline.length > 0 && (
                        <section>
                          <h4 className="font-semibold text-white">Shared medical records</h4>
                          <div className="mt-2 space-y-2">
                            {content.timeline.map((record) => (
                              <article key={record.id} className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                                <h5 className="font-medium text-slate-100">{record.title || record.recordType || 'Medical record'}</h5>
                                <p className="mt-1 text-xs text-slate-400">{formatDate(record.date)}</p>
                                {record.description && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{record.description}</p>}
                                {record.details && <p className="mt-2 text-xs text-slate-400">{displayValue(record.details)}</p>}
                              </article>
                            ))}
                          </div>
                        </section>
                      )}

                      {content.documents.length > 0 && (
                        <section>
                          <h4 className="font-semibold text-white">Shared files</h4>
                          <div className="mt-2 space-y-2">
                            {content.documents.map((document) => (
                              <article key={document.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                  <FileText size={17} className="shrink-0 text-cyan-200" />
                                  <div className="min-w-0">
                                    <h5 className="truncate font-medium text-slate-100">{document.title || document.originalFileName || 'Medical document'}</h5>
                                    <p className="mt-1 text-xs text-slate-400">{document.type.replace(/_/g, ' ')} · {formatDate(document.createdAt)}</p>
                                  </div>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                  <button type="button" onClick={() => retrieveDocument(share, document)} disabled={documentLoadingId === document.id} className="inline-flex items-center gap-1 rounded-full border border-cyan-300/25 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/10 disabled:opacity-50">
                                    {documentLoadingId === document.id ? <LoaderCircle size={13} className="animate-spin" /> : <Eye size={13} />}View
                                  </button>
                                  <button type="button" onClick={() => retrieveDocument(share, document, true)} disabled={documentLoadingId === document.id} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-50">
                                    <Download size={13} />Download
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        </section>
                      )}

                      {!content.profile && content.timeline.length === 0 && content.documents.length === 0 && (
                        <p className="text-sm text-slate-300">No records are currently available within this consent.</p>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </GlassCard>
      <MedicalDocumentViewer
        open={Boolean(activeDocument)}
        title={activeDocument?.title || activeDocument?.originalFileName || 'Shared medical document'}
        fileUrl={fileUrl}
        fileType={fileType}
        loading={false}
        error=""
        onClose={closeViewer}
      />
    </>
  )
}

export default SharedWithMe
