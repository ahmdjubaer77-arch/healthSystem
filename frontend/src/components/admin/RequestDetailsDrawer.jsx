import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Clock3, FileWarning, HeartPulse, MapPin, ShieldAlert, X } from 'lucide-react'
import Button from '../common/Button'
import StatusBadge from '../common/StatusBadge'

function Detail({ label, value }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-2 break-words text-sm text-slate-200">{value || 'Not provided'}</p></div>
}

function RequestDetailsDrawer({ request, type, onClose, onStatusChange, onReport, loading, canManage = true }) {
  const emergencyTransitions = {
    PENDING: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['RESOLVED', 'CANCELLED'],
    RESOLVED: [],
    CANCELLED: ['PENDING'],
  }
  const allowedEmergencyTransitions = emergencyTransitions[request?.status] || []
  const canModerate = type === 'Emergency'
    ? allowedEmergencyTransitions.length > 0
    : request?.status === 'PENDING' || request?.status === 'ACTIVE' || request?.status === 'MATCHED'
  return (
    <AnimatePresence>
      {request && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex justify-end bg-slate-950/65 backdrop-blur-sm" onClick={onClose}>
        <motion.aside initial={{ x: 520 }} animate={{ x: 0 }} exit={{ x: 520 }} transition={{ type: 'spring', damping: 28, stiffness: 260 }} className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950/95 p-5 shadow-2xl sm:p-7" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">{type} request</p><h2 className="mt-2 text-2xl font-semibold text-white">{request.requesterName}</h2><p className="mt-1 text-sm text-slate-400">{type === 'Blood' ? request.bloodGroup : request.requestType}</p></div><button type="button" onClick={onClose} className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/5" aria-label="Close request details"><X size={18} /></button></div>
          <div className="mt-6 flex flex-wrap items-center gap-3"><StatusBadge status={request.status} /><span className="text-xs text-slate-500">Verification: {request.verificationStatus}</span></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><Detail label={type === 'Blood' ? 'Blood group' : 'Request type'} value={type === 'Blood' ? request.bloodGroup : request.requestType} /><Detail label={type === 'Emergency' ? 'Hospital reference' : 'Hospital'} value={request.hospitalName} /><Detail label="Location" value={[request.division, request.district, request.upazila].filter(Boolean).join(' / ')} /><Detail label="Location type" value={request.locationType} />{type === 'Emergency' && <Detail label="Ambulance/provider reference" value={request.ambulanceName} />}{type === 'Blood' && <><Detail label="Quantity" value={`${request.quantity} ${request.unit}`} /><Detail label="Requester" value={request.requesterName} /></>}</div>
          {request.verificationReason && <div className="mt-4 rounded-2xl border border-red-300/15 bg-red-400/[0.06] p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-red-300/70">Verification reason</p><p className="mt-2 text-sm leading-6 text-slate-300">{request.verificationReason}</p></div>}
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center gap-2 text-sm font-medium text-white"><ShieldAlert size={17} className="text-cyan-300" /> Administrative actions</div><p className="mt-2 text-xs leading-5 text-slate-500">Status changes are saved by the backend. They do not dispatch an ambulance or confirm hospital acceptance.</p>{canModerate && canManage && <div className="mt-4 grid gap-2 sm:grid-cols-2">{type === 'Emergency' ? allowedEmergencyTransitions.map((status) => <Button key={status} size="sm" variant={status === 'CANCELLED' ? 'secondary' : 'primary'} disabled={loading} onClick={() => onStatusChange(status)}>{status === 'IN_PROGRESS' ? 'Set in progress' : status === 'RESOLVED' ? 'Set resolved' : status === 'CANCELLED' ? 'Cancel request' : 'Reopen request'}</Button>) : <><Button size="sm" variant="primary" disabled={loading} onClick={() => onStatusChange('ACTIVE')}><ShieldAlert size={15} /> Verify</Button><Button size="sm" variant="secondary" disabled={loading} onClick={() => onStatusChange('CANCELLED')}><FileWarning size={15} /> Reject / cancel</Button>{type === 'Blood' && <Button size="sm" variant="emergency" disabled={loading} onClick={onReport}><FileWarning size={15} /> Report</Button>}<Button size="sm" variant="secondary" disabled={loading} onClick={() => onStatusChange('MATCHED')}><Activity size={15} /> Mark matched</Button></>}</div>}</div>
          <div className="mt-6 grid gap-3 text-xs text-slate-500"><div className="flex items-center gap-2"><Clock3 size={14} /> Created {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(request.createdAt))}</div><div className="flex items-center gap-2"><Activity size={14} /> Updated {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(request.updatedAt))}</div></div>
          <p className="mt-6 text-xs leading-5 text-slate-600">Exact private locations are not included. Only general administrative location labels are shown.</p>
        </motion.aside>
      </motion.div>}
    </AnimatePresence>
  )
}

export default RequestDetailsDrawer
