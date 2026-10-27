import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Clock3, FileCheck2, ShieldAlert, X } from 'lucide-react'
import Button from '../common/Button'
import StatusBadge from '../common/StatusBadge'

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm text-slate-200">{value || 'Not provided'}</p>
    </div>
  )
}

function ProviderDetailsDrawer({ provider, onClose, onUnderReview, onVerify, onReject, onSuspend, onRestore, loading, verificationCenter = false, canManage = true }) {
  return (
    <AnimatePresence>
      {provider && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex justify-end bg-slate-950/65 backdrop-blur-sm" onClick={onClose}>
          <motion.aside initial={{ x: 520 }} animate={{ x: 0 }} exit={{ x: 520 }} transition={{ type: 'spring', damping: 28, stiffness: 260 }} className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950/95 p-5 shadow-2xl sm:p-7" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Provider profile</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{provider.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{provider.providerType}</p>
              </div>
              <button type="button" onClick={onClose} className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/5" aria-label="Close provider details"><X size={18} /></button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <StatusBadge status={provider.verificationStatus} />
              <span className="text-xs text-slate-500">Created {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(provider.createdAt))}</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Detail label="Contact phone" value={provider.contactPhone} />
              <Detail label="Contact email" value={provider.contactEmail} />
              <Detail label="Address" value={provider.address} />
              {provider.specialty && <Detail label="Specialty" value={provider.specialty} />}
              {provider.specialty && <Detail label="Specialty" value={provider.specialty} />}
              <Detail label="Division" value={provider.division} />
              <Detail label="District" value={provider.district} />
              <Detail label="Upazila" value={provider.upazila} />
              <Detail label="Registration number" value={provider.registrationNumber} />
              <Detail label="License number" value={provider.licenseNumber} />
            </div>

            {provider.vehicles?.length > 0 && <section className="mt-6"><h3 className="text-sm font-medium text-white">Vehicle information</h3><div className="mt-3 space-y-2">{provider.vehicles.map((vehicle, index) => <div key={`${vehicle.registrationNumber}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-sm font-medium text-slate-200">{vehicle.vehicleType || 'Vehicle'}</p><p className="mt-1 text-xs text-slate-500">Registration {vehicle.registrationNumber || 'not provided'} · Capacity {vehicle.capacity || 'not provided'}</p>{vehicle.equipment?.length > 0 && <p className="mt-2 text-xs text-slate-400">Equipment: {vehicle.equipment.join(', ')}</p>}</div>)}</div></section>}

            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><FileCheck2 size={17} className="text-cyan-300" /> Submitted documents</div>
              {provider.submittedDocuments?.length ? (
                <div className="mt-3 space-y-2">{provider.submittedDocuments.map((document) => <div key={`${document.documentType}-${document.fileName}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-sm font-medium text-slate-200">{document.documentType}</p><p className="mt-1 truncate text-xs text-slate-500">{document.fileName}</p><p className="mt-2 text-[10px] uppercase tracking-widest text-slate-600">Submitted {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(document.uploadedAt))}</p></div>)}</div>
              ) : <p className="mt-3 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No documents were submitted.</p>}
            </div>

            {provider.verificationReason && <div className="mt-4 rounded-2xl border border-red-300/15 bg-red-400/[0.06] p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-red-300/70">Rejection reason</p><p className="mt-2 text-sm leading-6 text-slate-300">{provider.verificationReason}</p></div>}

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><ShieldAlert size={17} className="text-cyan-300" /> Verification actions</div>
              <p className="mt-2 text-xs leading-5 text-slate-500">Only the backend verification status determines whether this provider is displayed as verified.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {verificationCenter ? canManage && <>
                  {provider.verificationStatus !== 'VERIFIED' && provider.verificationStatus !== 'SUSPENDED' && <Button size="sm" variant="primary" disabled={loading} onClick={onVerify}><CheckCircle2 size={15} /> Verify</Button>}
                  {provider.verificationStatus !== 'REJECTED' && provider.verificationStatus !== 'SUSPENDED' && <Button size="sm" variant="secondary" disabled={loading} onClick={onReject}><ShieldAlert size={15} /> Reject</Button>}
                  {provider.verificationStatus === 'SUSPENDED'
                    ? <Button size="sm" variant="primary" disabled={loading} onClick={onRestore}><CheckCircle2 size={15} /> Restore</Button>
                    : <Button size="sm" variant="emergency" disabled={loading} onClick={onSuspend}><Clock3 size={15} /> Suspend</Button>}
                </> : <>
                  {provider.verificationStatus === 'PENDING' && <Button size="sm" variant="primary" disabled={loading} onClick={onUnderReview}><Clock3 size={15} /> Under Review</Button>}
                  {provider.verificationStatus === 'UNDER_REVIEW' && <><Button size="sm" variant="primary" disabled={loading} onClick={onVerify}><CheckCircle2 size={15} /> Verify</Button><Button size="sm" variant="secondary" disabled={loading} onClick={onReject}><ShieldAlert size={15} /> Reject</Button><Button size="sm" variant="emergency" disabled={loading} onClick={onSuspend}><Clock3 size={15} /> Suspend</Button></>}
                </>}
              </div>
            </div>

            <p className="mt-6 text-xs leading-5 text-slate-600">Private document storage identifiers and medical records are not included in this administrative view.</p>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProviderDetailsDrawer
