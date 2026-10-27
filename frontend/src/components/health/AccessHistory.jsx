import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, ShieldCheck } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import { getHealthAccessHistory } from '../../services/api'

const actionLabels = {
  VIEW: 'Viewed',
  DOWNLOAD: 'Downloaded',
  ACCESS_DENIED: 'Access denied',
  SHARE_GRANTED: 'Consent granted',
  SHARE_REVOKED: 'Consent revoked',
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString()
}

function AccessHistory({ accessToken, records = [], documents = [], refreshKey = 0 }) {
  const [action, setAction] = useState('')
  const [result, setResult] = useState('')
  const [page, setPage] = useState(1)
  const [history, setHistory] = useState({ records: [], pagination: { page: 1, totalPages: 0, total: 0 } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const resourceNames = useMemo(() => {
    const names = new Map()
    records.forEach((record) => names.set(record.id, record.title || 'Medical timeline record'))
    documents.forEach((document) => names.set(document.id, document.title || document.originalFileName || 'Medical document'))
    return names
  }, [records, documents])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getHealthAccessHistory(accessToken, { page, limit: 10, action, result })
      .then((response) => {
        if (active) setHistory(response)
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [accessToken, page, action, result, refreshKey])

  const changeFilter = (setter, value) => {
    setter(value)
    setPage(1)
  }

  const resourceLabel = (record) => {
    if (record.resourceType === 'PROFILE') return 'Health profile'
    if (record.resourceType === 'SHARE') return 'Sharing permission'
    return resourceNames.get(record.resourceId)
      || `${record.resourceType.toLowerCase()} record ${record.resourceId?.slice(-6) || ''}`.trim()
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
          <ShieldCheck size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Access history</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Who accessed your information</h2>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-300">
          Activity
          <select
            value={action}
            onChange={(event) => changeFilter(setAction, event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-white focus:border-cyan-300/60 focus:outline-none"
          >
            <option value="">All activity</option>
            <option value="VIEW">Views</option>
            <option value="DOWNLOAD">Downloads</option>
            <option value="ACCESS_DENIED">Denied attempts</option>
            <option value="SHARE_GRANTED">Consent granted</option>
            <option value="SHARE_REVOKED">Consent revoked</option>
          </select>
        </label>
        <label className="text-sm text-slate-300">
          Result
          <select
            value={result}
            onChange={(event) => changeFilter(setResult, event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-white focus:border-cyan-300/60 focus:outline-none"
          >
            <option value="">All results</option>
            <option value="SUCCESS">Successful</option>
            <option value="DENIED">Denied</option>
          </select>
        </label>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-300"><LoaderCircle size={16} className="animate-spin" />Loading access history…</div>
      ) : history.records.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4 text-sm text-slate-300">No activity matches these filters.</div>
      ) : (
        <>
          <div className="space-y-3">
            {history.records.map((record) => (
              <article key={record.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">{record.actor.name}</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    {actionLabels[record.action] || record.action} · {resourceLabel(record)}
                  </p>
                  {record.actor.providerType && <p className="mt-1 text-xs text-slate-400">{record.actor.providerType}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full border px-2.5 py-1 font-semibold ${
                    record.result === 'SUCCESS'
                      ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
                      : 'border-amber-300/30 bg-amber-400/10 text-amber-100'
                  }`}>
                    {record.result === 'SUCCESS' ? 'Successful' : 'Denied'}
                  </span>
                  <time className="text-slate-300">{formatDate(record.timestamp)}</time>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">{history.pagination.total} events · Newest first</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="self-center text-xs text-slate-300">{page} / {Math.max(1, history.pagination.totalPages)}</span>
              <button
                type="button"
                disabled={page >= history.pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  )
}

export default AccessHistory
