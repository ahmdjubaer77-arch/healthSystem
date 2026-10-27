import { MapPin, ShieldCheck } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import StatusBadge from '../common/StatusBadge'
import { useLanguage } from '../../context/LanguageContext'

function BloodDonorCard({ donor }) {
  const { t } = useLanguage()
  const badgeVariant = donor.availability === 'AVAILABLE' ? 'success' : 'warning'

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{t('homeDonorVerified', 'Verified donor')}</h3>
          <p className="mt-1 text-sm text-cyan-100">{t('homeBloodGroup', 'Blood Group')}: {donor.bloodGroup}</p>
        </div>
        <StatusBadge label={t('available', 'Available')} variant={badgeVariant} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/20 p-3">
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <MapPin size={14} className="text-cyan-200" />
          {t('homeApproximate', 'Approx.')} {[donor.location?.upazila, donor.location?.district].filter(Boolean).join(', ') || t('homeLocationNotListed', 'Location not listed')}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-300">
        <span className="flex items-center gap-1 text-emerald-300">
          <ShieldCheck size={12} />
          {t('homeVerifiedListing', 'Verified listing')}
        </span>
      </div>
    </GlassCard>
  )
}

export default BloodDonorCard
