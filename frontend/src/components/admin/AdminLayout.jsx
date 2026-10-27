import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import AdminMobileSidebar from './AdminMobileSidebar'

function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="admin-shell min-h-screen text-[var(--text-soft)]">
      <AdminSidebar />
      <AdminMobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="admin-content min-h-screen lg:pl-72">
        <AdminHeader onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="admin-main px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
