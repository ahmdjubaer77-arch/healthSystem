import EmptyState from '../common/EmptyState'

function AdminEmptyState({ title = 'No records found', description, action }) {
  return (
    <EmptyState
      title={title}
      description={description || 'There are no records available for this section yet.'}
      action={action}
    />
  )
}

export default AdminEmptyState
