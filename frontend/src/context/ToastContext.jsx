import { createContext, useContext, useMemo, useState } from 'react'
import Toast from '../components/common/Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const removeToast = (id) => {
    setItems((current) => current.filter((toast) => toast.id !== id))
  }

  const addToast = ({ type = 'info', title = '', message = '', duration = 3200 }) => {
    const id = Date.now() + Math.random()
    const toast = { id, type, title, message }

    setItems((current) => [...current, toast])

    window.setTimeout(() => removeToast(id), duration)
  }

  const value = useMemo(() => ({ addToast, removeToast }), [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast items={items} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
