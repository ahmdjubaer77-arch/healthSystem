import { motion } from 'framer-motion'
import { Activity, HeartPulse, ShieldCheck, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'

function DoctorHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-[30px] border border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),rgba(15,23,42,0.72)_30%,rgba(15,23,42,1)_100%)] p-5 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
            <Stethoscope size={12} />
            trusted care
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-white sm:text-4xl">সঠিক চিকিৎসক খুঁজে নিন</h1>
          <p className="mt-2 text-lg font-medium text-cyan-100">Find the Right Doctor</p>
          <p className="mt-3 max-w-xl text-sm text-slate-200 sm:text-base">
            আপনার প্রয়োজন অনুযায়ী বিশেষজ্ঞ চিকিৎসক ও স্বাস্থ্যসেবা প্রদানকারী খুঁজে নিন। Discover healthcare providers by specialty, location and hospital.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
            <div className="mb-2 flex items-center gap-2 text-cyan-100"><Stethoscope size={15} /> Specialists</div>
            Trusted care pathways
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
            <div className="mb-2 flex items-center gap-2 text-cyan-100"><HeartPulse size={15} /> Care</div>
            Profiles reviewed before publication
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
            <div className="mb-2 flex items-center gap-2 text-cyan-100"><ShieldCheck size={15} /> Trust</div>
            Credential review by administrators
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/doctors" className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/15">
          Find doctors
        </Link>
        <Link to="/providers" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
          Provider directory
        </Link>
        <Link to="/emergency" className="inline-flex items-center justify-center rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 hover:bg-red-500/15">
          Need emergency care?
        </Link>
        <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100">
          <Activity size={14} />
          Verified doctor directory
        </div>
      </div>
    </motion.section>
  )
}

export default DoctorHero
