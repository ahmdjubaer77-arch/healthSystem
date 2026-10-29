import { useState } from 'react'
import { ShieldCheck, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createAdminAccount } from '../services/api'
import AdminPageContainer from '../components/admin/AdminPageContainer'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import GlassCard from '../components/common/GlassCard'
import Button from '../components/common/Button'
import ErrorState from '../components/common/ErrorState'

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'ADMIN',
}

function AdminCreateAccount() {
  const { accessToken } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdUser, setCreatedUser] = useState(null)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createAdminAccount(accessToken, {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      })
      setCreatedUser(result)
      setForm(initialForm)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        eyebrow="Administration"
        title="Create administrator"
        description="Create a platform administrator account. Only a Super Admin can use this page."
      />

      {error && <ErrorState message={error} className="mb-6" />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <GlassCard className="p-5 sm:p-7">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
              <UserPlus size={21} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">New administrator account</h2>
              <p className="mt-1 text-sm text-slate-400">The password is hashed before storage. The new administrator must verify their email before signing in.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-200">Full name</span>
              <input name="name" value={form.name} onChange={updateField} autoComplete="name" required minLength="2" maxLength="100" className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/30 px-4 text-sm text-white outline-none focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/10" placeholder="Administrator name" />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">Email address</span>
              <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required maxLength="254" className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/30 px-4 text-sm text-white outline-none focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/10" placeholder="admin@example.com" />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">Administrator role</span>
              <select name="role" value={form.role} onChange={updateField} className="h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 text-sm text-white outline-none focus:border-cyan-300/40">
                <option value="ADMIN">Administrator</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
              <input name="password" type="password" value={form.password} onChange={updateField} autoComplete="new-password" required minLength="8" maxLength="72" className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/30 px-4 text-sm text-white outline-none focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/10" placeholder="At least 8 characters" />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">Confirm password</span>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} autoComplete="new-password" required minLength="8" maxLength="72" className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/30 px-4 text-sm text-white outline-none focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/10" placeholder="Repeat password" />
            </label>

            <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="submit" icon={false} disabled={isSubmitting} className="sm:min-w-56">
                {isSubmitting ? 'Creating account…' : 'Create administrator'}
              </Button>
            </div>
          </form>
        </GlassCard>

        <aside className="space-y-4">
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 text-cyan-200">
              <ShieldCheck size={20} />
              <h2 className="font-semibold text-white">Security controls</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-5 text-slate-400">
              <li>• Only SUPER_ADMIN can create administrators.</li>
              <li>• Email and password are validated server-side.</li>
              <li>• Passwords are hashed with bcrypt.</li>
              <li>• The action is written to the audit log.</li>
            </ul>
          </GlassCard>

          {createdUser && (
            <GlassCard className="border-emerald-300/20 bg-emerald-400/[0.06] p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Account created</p>
              <p className="mt-3 font-semibold text-white">{createdUser.name}</p>
              <p className="mt-1 break-all text-sm text-slate-300">{createdUser.email}</p>
              <p className="mt-3 text-xs text-slate-400">Role: {createdUser.role}</p>
              <p className="mt-3 text-sm text-emerald-100">A verification code has been sent to this address.</p>
            </GlassCard>
          )}
        </aside>
      </div>
    </AdminPageContainer>
  )
}

export default AdminCreateAccount
