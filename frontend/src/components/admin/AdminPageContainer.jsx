function AdminPageContainer({ children, className = '', ...props }) {
  return (
    <div className={`admin-page-container mx-auto w-full max-w-[1600px] ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

export default AdminPageContainer
