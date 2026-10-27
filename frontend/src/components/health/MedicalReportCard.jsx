import { Download, Eye, FileImage } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getMedicalDocumentContent } from '../../services/api'
import GlassCard from '../common/GlassCard'
import StatusBadge from '../common/StatusBadge'
import MedicalDocumentViewer from './MedicalDocumentViewer'

function MedicalReportCard({ report }) {
  const { accessToken } = useAuth()
  const [viewerOpen, setViewerOpen] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('')
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const viewRequestRef = useRef(0)

  useEffect(() => () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl)
  }, [fileUrl])

  const loadFile = async () => {
    if (!report.fileReference) {
      const missingError = new Error('This report file is unavailable.')
      missingError.status = 404
      throw missingError
    }

    return getMedicalDocumentContent(accessToken, report.fileReference)
  }

  const showFileError = (requestError) => {
    if (requestError.status === 401) {
      setError('Please sign in again to access this report.')
    } else if (requestError.status === 403) {
      setError('You do not have permission to access this report.')
    } else if (requestError.status === 404) {
      setError('This report file is unavailable.')
    } else {
      setError(requestError.message || 'Unable to retrieve this report.')
    }
  }

  const closeViewer = () => {
    viewRequestRef.current += 1
    setViewerOpen(false)
    setFileUrl('')
    setFileType('')
    setLoading(false)
  }

  const handleView = async () => {
    const requestId = viewRequestRef.current + 1
    viewRequestRef.current = requestId
    setViewerOpen(true)
    setLoading(true)
    setError('')
    setFileUrl('')
    setFileType('')

    try {
      const blob = await loadFile()
      if (viewRequestRef.current !== requestId) return
      setFileType(blob.type)
      setFileUrl(URL.createObjectURL(blob))
    } catch (requestError) {
      if (viewRequestRef.current !== requestId) return
      showFileError(requestError)
    } finally {
      if (viewRequestRef.current === requestId) setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    setError('')

    try {
      const blob = await loadFile()
      const contentType = blob.type || ''

      if (contentType === 'application/pdf' || report.fileFormat?.toLowerCase() === 'pdf') {
        setError('PNG download is unavailable for PDF reports because PDF-to-image conversion is not configured.')
        return
      }

      if (!['image/png', 'image/jpeg', 'image/webp'].includes(contentType)) {
        setError('This report file type cannot be converted to PNG.')
        return
      }

      const image = await createImageBitmap(blob)
      const canvas = document.createElement('canvas')
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
        throw new Error('Unable to convert this report to PNG.')
      }

      const downloadUrl = URL.createObjectURL(pngBlob)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = `${report.name || 'medical-report'}.png`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
    } catch (requestError) {
      showFileError(requestError)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
            <FileImage size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{report.name}</h3>
            <p className="text-sm text-slate-300">{report.category}</p>
          </div>
        </div>
        <StatusBadge label={report.status} variant={report.statusVariant} compact />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">Date</p>
          <p className="mt-2 text-sm font-medium text-white">{report.date}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">Category</p>
          <p className="mt-2 text-sm font-medium text-white">{report.category}</p>
        </div>
      </div>

      {report.result && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">Patient-entered result</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-white">{report.result}</p>
          {report.resultContext && <p className="mt-2 text-xs text-slate-300">{report.resultContext}</p>}
          {report.secureFile && <p className="mt-2 text-xs text-cyan-100">Secure file: {report.secureFile}</p>}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={handleView} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-50">
          <Eye size={14} />
          {loading && !downloading ? 'Loading…' : 'View'}
        </button>
        <button type="button" onClick={handleDownload} disabled={downloading} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/70 disabled:opacity-50">
          <Download size={14} />
          {downloading ? 'Preparing…' : 'Download PNG'}
        </button>
      </div>
      {error && !viewerOpen && (
        <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100" role="alert">
          {error}
        </p>
      )}

      <MedicalDocumentViewer
        open={viewerOpen}
        title={report.name}
        fileUrl={fileUrl}
        fileType={fileType}
        loading={loading}
        error={error}
        onClose={closeViewer}
      />
    </GlassCard>
  )
}

export default MedicalReportCard
