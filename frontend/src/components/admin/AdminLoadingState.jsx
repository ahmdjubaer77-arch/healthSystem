import LoadingState from '../common/LoadingState'

function AdminLoadingState({ message = 'Loading admin data…', compact = false }) {
  return <LoadingState message={message} compact={compact} />
}

export default AdminLoadingState
