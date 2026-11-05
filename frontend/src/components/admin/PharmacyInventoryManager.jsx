import ThemedSelect from '../common/ThemedSelect'
import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  createAdminPharmacyMedicine,
  deleteAdminPharmacyMedicine,
  getAdminPharmacyMedicines,
  updateAdminPharmacyMedicine,
} from '../../services/api'
import GlassCard from '../common/GlassCard'
import LoadingState from '../common/LoadingState'
import ErrorState from '../common/ErrorState'
import ConfirmModal from '../common/ConfirmModal'
import Button from '../common/Button'

const EMPTY_FORM = {
  name: '',
  genericName: '',
  strength: '',
  dosageForm: '',
  availability: 'AVAILABLE',
}

function PharmacyInventoryManager({ pharmacy, accessToken, canUpdate, onClose }) {
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadInventory = async () => {
    setLoading(true)
    setError('')
    try {
      setRecords(await getAdminPharmacyMedicines(accessToken, pharmacy.id))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [accessToken, pharmacy.id])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await updateAdminPharmacyMedicine(accessToken, pharmacy.id, editingId, form)
      } else {
        await createAdminPharmacyMedicine(accessToken, pharmacy.id, form)
      }
      setForm(EMPTY_FORM)
      setEditingId('')
      await loadInventory()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const edit = (record) => {
    setEditingId(record.id)
    setForm({
      name: record.name,
      genericName: record.genericName,
      strength: record.strength,
      dosageForm: record.dosageForm,
      availability: record.availability,
    })
  }

  const remove = async () => {
    if (!deleteTarget) return
    setSaving(true)
    setError('')
    try {
      await deleteAdminPharmacyMedicine(accessToken, pharmacy.id, deleteTarget.id)
      setDeleteTarget(null)
      await loadInventory()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-3 sm:p-5" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pharmacy-inventory-title"
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--page-border)] bg-[var(--page-surface-raised)] p-4 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--page-muted)]">Pharmacy inventory</p>
            <h2 id="pharmacy-inventory-title" className="mt-1 text-xl font-semibold text-[var(--page-text)]">{pharmacy.name}</h2>
            <p className="mt-2 text-sm text-[var(--page-muted)]">Availability is listed for public discovery. Ask the pharmacy to confirm before travelling.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close inventory" className="rounded-lg border border-[var(--page-border)] p-2 text-[var(--page-text)] hover:bg-[var(--page-surface-sunken)]">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {error && <div className="mt-4"><ErrorState message={error} onRetry={loadInventory} /></div>}

        {canUpdate && (
          <GlassCard className="mt-5 p-4">
            <h3 className="text-base font-semibold text-[var(--page-text)]">{editingId ? 'Edit medicine' : 'Add medicine availability'}</h3>
            <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="text-sm text-[var(--page-text)]">
                <span className="mb-1.5 block">Medicine name</span>
                <input required maxLength={160} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--page-border)] bg-[var(--page-surface)] px-3 outline-none focus:border-[var(--page-accent)]" />
              </label>
              <label className="text-sm text-[var(--page-text)]">
                <span className="mb-1.5 block">Generic name</span>
                <input maxLength={160} value={form.genericName} onChange={(event) => setForm((current) => ({ ...current, genericName: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--page-border)] bg-[var(--page-surface)] px-3 outline-none focus:border-[var(--page-accent)]" />
              </label>
              <label className="text-sm text-[var(--page-text)]">
                <span className="mb-1.5 block">Strength</span>
                <input required maxLength={80} value={form.strength} onChange={(event) => setForm((current) => ({ ...current, strength: event.target.value }))} placeholder="e.g. 500 mg" className="h-10 w-full rounded-lg border border-[var(--page-border)] bg-[var(--page-surface)] px-3 outline-none focus:border-[var(--page-accent)]" />
              </label>
              <label className="text-sm text-[var(--page-text)]">
                <span className="mb-1.5 block">Dosage form</span>
                <input required maxLength={80} value={form.dosageForm} onChange={(event) => setForm((current) => ({ ...current, dosageForm: event.target.value }))} placeholder="Tablet, capsule..." className="h-10 w-full rounded-lg border border-[var(--page-border)] bg-[var(--page-surface)] px-3 outline-none focus:border-[var(--page-accent)]" />
              </label>
              <label className="text-sm text-[var(--page-text)]">
                <span className="mb-1.5 block">Availability</span>
                <ThemedSelect value={form.availability} onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--page-border)] bg-[var(--page-surface)] px-3 outline-none focus:border-[var(--page-accent)]">
                  <option value="AVAILABLE">Available</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </ThemedSelect>
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-5">
                <Button type="submit" disabled={saving}><Plus size={15} />{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add listing'}</Button>
                {editingId && <Button type="button" variant="secondary" icon={false} onClick={() => { setEditingId(''); setForm(EMPTY_FORM) }}>Cancel edit</Button>}
              </div>
            </form>
          </GlassCard>
        )}

        <div className="mt-5">
          {loading && <LoadingState label="Loading pharmacy inventory" />}
          {!loading && !error && records.length === 0 && <p className="rounded-xl border border-dashed border-[var(--page-border)] p-6 text-center text-sm text-[var(--page-muted)]">No medicine availability has been added.</p>}
          {!loading && !error && records.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[var(--page-border)]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-[var(--page-surface-sunken)] text-[var(--page-muted)]">
                  <tr><th className="px-4 py-3">Medicine</th><th className="px-4 py-3">Strength / form</th><th className="px-4 py-3">Availability</th><th className="px-4 py-3">Updated</th>{canUpdate && <th className="px-4 py-3">Actions</th>}</tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-t border-[var(--page-border)]">
                      <td className="px-4 py-3"><span className="font-medium text-[var(--page-text)]">{record.name}</span>{record.genericName && <span className="mt-1 block text-xs text-[var(--page-muted)]">{record.genericName}</span>}</td>
                      <td className="px-4 py-3 text-[var(--page-muted)]">{record.strength} · {record.dosageForm}</td>
                      <td className="px-4 py-3 text-[var(--page-text)]">{record.availability === 'AVAILABLE' ? 'Available' : 'Unavailable'}</td>
                      <td className="px-4 py-3 text-[var(--page-muted)]">{new Date(record.updatedAt).toLocaleDateString()}</td>
                      {canUpdate && <td className="px-4 py-3"><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => edit(record)} aria-label={`Edit ${record.name}`}><Pencil size={14} /></Button><Button size="sm" variant="emergency" onClick={() => setDeleteTarget(record)} aria-label={`Remove ${record.name}`}><Trash2 size={14} /></Button></div></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title="Remove medicine listing?"
        description={`Remove ${deleteTarget?.name || 'this medicine'} from public pharmacy availability?`}
        confirmText="Remove listing"
      />
    </div>
  )
}

export default PharmacyInventoryManager
