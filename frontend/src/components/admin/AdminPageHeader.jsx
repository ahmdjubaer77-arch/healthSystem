import Button from '../common/Button'

function AdminPageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="admin-page-heading mb-7 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">{eyebrow}</p>
        )}
        <h1 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>}
      </div>
      {action && (
        <Button type="button" icon={action.icon !== false} onClick={action.onClick} className="admin-page-heading-action self-start sm:self-auto">
          {action.label}
        </Button>
      )}
    </header>
  )
}

export default AdminPageHeader
