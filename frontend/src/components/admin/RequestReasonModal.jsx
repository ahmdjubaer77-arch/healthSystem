import Button from '../common/Button'
import GlassCard from '../common/GlassCard'

function RequestReasonModal({ open, title, description, value, onChange, onClose, onConfirm, loading, confirmText }) {
  if (!open) return null
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"><GlassCard className="w-full max-w-md p-5"><h3 className="text-lg font-semibold text-white">{title}</h3><p className="mt-2 text-sm text-slate-400">{description}</p><textarea value={value} onChange={(event) => onChange(event.target.value)} rows="4" className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-red-300/30" placeholder="Provide the reason for this administrative action" /><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="emergency" disabled={!value.trim() || loading} onClick={onConfirm}>{confirmText}</Button></div></GlassCard></div>
}

export default RequestReasonModal
