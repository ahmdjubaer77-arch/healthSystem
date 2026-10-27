import { Download, Eye, FileText, Search, SortAsc } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getMedicalDocumentContent } from '../../services/api'
import GlassCard from '../common/GlassCard'
import StatusBadge from '../common/StatusBadge'
import MedicalDocumentViewer from './MedicalDocumentViewer'

function DocumentList({ documents }) {
  const { accessToken } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [activeDocument, setActiveDocument] = useState(null)
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('')
  const [loadingId, setLoadingId] = useState('')
  const [downloadingId, setDownloadingId] = useState('')
  const [error, setError] = useState(null)
  const viewRequestRef = useRef(0)

  useEffect(() => () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl)
  }, [fileUrl])

  const getFile = async (document) => {
    if (!document.id) {
      const missingError = new Error('This document file is unavailable.')
      missingError.status = 404
      throw missingError
    }
    return getMedicalDocumentContent(accessToken, document.id)
  }

  const getErrorMessage = (requestError) => {
    if (requestError.status === 401) return 'Please sign in again to access this document.'
    if (requestError.status === 403) return 'You do not have permission to access this document.'
    if (requestError.status === 404) return 'This document file is unavailable.'
    return requestError.message || 'Unable to retrieve this document.'
  }

  const handleView = async (document) => {
    const requestId = viewRequestRef.current + 1
    viewRequestRef.current = requestId
    setActiveDocument(document)
    setFileUrl('')
    setFileType('')
    setError(null)
    setLoadingId(document.id)

    try {
      const blob = await getFile(document)
      if (viewRequestRef.current !== requestId) return
      setFileType(blob.type)
      setFileUrl(URL.createObjectURL(blob))
    } catch (requestError) {
      if (viewRequestRef.current !== requestId) return
      setError({ id: document.id, message: getErrorMessage(requestError) })
    } finally {
      if (viewRequestRef.current === requestId) setLoadingId('')
    }
  }

  const handleDownload = async (document) => {
    setDownloadingId(document.id)
    setError(null)

    try {
      const blob = await getFile(document)
      const contentType = blob.type || ''

      if (contentType === 'application/pdf' || document.format?.toLowerCase() === 'pdf') {
        setError({
          id: document.id,
          message: 'PNG download is unavailable for PDF documents because PDF-to-image conversion is not configured.',
        })
        return
      }
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(contentType)) {
        setError({ id: document.id, message: 'This document file type cannot be converted to PNG.' })
        return
      }

      const image = await createImageBitmap(blob)
      const canvas = window.document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Unable to prepare the PNG download.')
      try {
        context.drawImage(image, 0, 0)
      } finally {
        image.close()
      }

      const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!pngBlob || pngBlob.type !== 'image/png') {
        throw new Error('Unable to convert this document to PNG.')
      }

      const downloadUrl = URL.createObjectURL(pngBlob)
      const anchor = window.document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = `${document.title || 'health-document'}.png`
      window.document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
    } catch (requestError) {
      setError({ id: document.id, message: getErrorMessage(requestError) })
    } finally {
      setDownloadingId('')
    }
  }

  const closeViewer = () => {
    viewRequestRef.current += 1
    setActiveDocument(null)
    setFileUrl('')
    setFileType('')
    setError(null)
    setLoadingId('')
  }

  const filteredDocuments = useMemo(() => {
    const items = documents.filter((document) => {
      const documentCategory = document.type === 'PRESCRIPTION' ? 'Prescriptions' : 'Reports'
      const matchesCategory = category === 'All' || documentCategory === category
      const matchesSearch = document.title.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })

    return [...items].sort((a, b) => (sortBy === 'newest' ? b.createdAt.localeCompare(a.createdAt) : a.title.localeCompare(b.title)))
  }, [category, documents, search, sortBy])

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Document management</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Health Documents</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/20 px-3 py-2">
            <Search size={14} className="text-cyan-200" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search documents"
              placeholder="Search documents"
              className="w-28 bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
            className="rounded-full border border-white/10 bg-slate-950/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
          >
            <option>All</option>
            <option>Prescriptions</option>
            <option>Reports</option>
            <option>Imaging</option>
            <option>Vaccination</option>
            <option>Other</option>
          </select>

          <button
            type="button"
            onClick={() => setSortBy((current) => (current === 'newest' ? 'alpha' : 'newest'))}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/20 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            <SortAsc size={14} />
            {sortBy === 'newest' ? 'Newest' : 'A-Z'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredDocuments.map((document) => (
          <div key={document.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{document.title}</h3>
                <p className="text-sm text-slate-300">{document.type === 'PRESCRIPTION' ? 'Prescriptions' : 'Reports'} • {new Date(document.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label="Private" variant="info" compact />
              <button type="button" onClick={() => handleView(document)} disabled={loadingId === document.id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/70 disabled:opacity-50">
                <Eye size={14} />
                {loadingId === document.id ? 'Loading…' : 'View'}
              </button>
              <button type="button" onClick={() => handleDownload(document)} disabled={downloadingId === document.id} className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-50">
                <Download size={14} />
                {downloadingId === document.id ? 'Preparing…' : 'Download PNG'}
              </button>
            </div>
          </div>
          {error?.id === document.id && !activeDocument && (
            <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100" role="alert">
              {error.message}
            </p>
          )}
          </div>
        ))}
      </div>

      <MedicalDocumentViewer
        open={Boolean(activeDocument)}
        title={activeDocument?.title || ''}
        fileUrl={fileUrl}
        fileType={fileType}
        loading={Boolean(activeDocument && loadingId === activeDocument.id)}
        error={error && activeDocument && error.id === activeDocument.id ? error.message : ''}
        onClose={closeViewer}
      />
    </GlassCard>
  )
}

export default DocumentList
