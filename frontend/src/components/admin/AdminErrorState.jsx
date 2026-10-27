import ErrorState from '../common/ErrorState'

function AdminErrorState({ title = 'Unable to load admin data', description, action }) {
  return (
    <ErrorState
      title={title}
      description={description || 'The requested administration data could not be loaded.'}
      action={action}
    />
  )
}

export default AdminErrorState
