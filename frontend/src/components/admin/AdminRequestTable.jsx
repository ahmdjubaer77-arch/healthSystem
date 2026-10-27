import { ChevronLeft, ChevronRight, MapPin, UserRound } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'

function AdminRequestTable({ records, pagination, loading, onSelect, onPageChange, typeLabel }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/45 shadow-[0_20px_70px_rgba(2,8,23,0.25)] backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.025] text-[10px] uppercase tracking-[0.16em] text-slate-500"><tr><th className="px-5 py-4">{typeLabel} record</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Location</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Action</th></tr></thead>
          <tbody>
            {records.map((record) => <tr key={record.id} className="border-b border-white/[0.06] last:border-0 transition hover:bg-white/[0.025]"><td className="px-5 py-4"><button type="button" onClick={() => onSelect(record)} className="flex items-center gap-3 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200"><UserRound size={17} /></span><span><span className="block font-medium text-white">{record.requesterName}</span><span className="block text-xs text-slate-500">{record.bloodGroup || record.requestType || 'Request record'}</span></span></button></td><td className="px-5 py-4"><StatusBadge status={record.status} /></td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 text-slate-400"><MapPin size={13} />{[record.division, record.district, record.upazila].filter(Boolean).join(' / ') || '—'}</span></td><td className="px-5 py-4 text-xs text-slate-500">{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(record.createdAt))}</td><td className="px-5 py-4"><button type="button" onClick={() => onSelect(record)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10">View</button></td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4"><p className="text-xs text-slate-500">{pagination.total} requests</p><div className="flex items-center gap-2"><button type="button" aria-label="Previous page" disabled={pagination.page <= 1 || loading} onClick={() => onPageChange(pagination.page - 1)} className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 p-2 disabled:opacity-40"><ChevronLeft size={16} /></button><span className="text-xs text-slate-400">Page {pagination.page} of {pagination.pages}</span><button type="button" aria-label="Next page" disabled={pagination.page >= pagination.pages || loading} onClick={() => onPageChange(pagination.page + 1)} className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 p-2 disabled:opacity-40"><ChevronRight size={16} /></button></div></div>
    </div>
  )
}

export default AdminRequestTable
