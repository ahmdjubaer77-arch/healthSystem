import { CloudUpload, FileText, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { uploadMedicalDocument } from '../../services/api'
import GlassCard from '../common/GlassCard'

function DocumentUploader({ onUploaded }) {
  const inputRef = useRef(null)
  const { accessToken } = useAuth()
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadState, setUploadState] = useState('idle')
  const [uploadError, setUploadError] = useState('')

  const handleFileSelect = (file) => {
    if (!file) return

    setSelectedFile(file)
    setUploadState('ready')
    setUploadError('')
  }

  const onInputChange = (event) => {
    const file = event.target.files?.[0]
    handleFileSelect(file)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    handleFileSelect(file)
  }

  const handleBrowse = () => inputRef.current?.click()

  const handleUpload = async () => {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('type', 'PRESCRIPTION')
    formData.append('title', selectedFile.name.replace(/\.[^.]+$/, ''))
    formData.append('description', '')

    setUploadState('uploading')
    setUploadError('')

    try {
      await uploadMedicalDocument(accessToken, formData)
      setUploadState('success')
      setSelectedFile(null)
      if (typeof onUploaded === 'function') {
        await onUploaded()
      }
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } catch (error) {
      setUploadState('error')
      setUploadError(error.message || 'Unable to upload the medical document.')
    }
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Document upload</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Add a medical document</h2>
      </div>

      <div
        className={`rounded-[24px] border border-dashed p-5 transition ${
          isDragging ? 'border-cyan-300 bg-cyan-400/10' : 'border-white/15 bg-slate-950/20'
        }`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={onInputChange} />

        <div className="flex flex-col items-center justify-center py-5 text-center">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-cyan-100">
            <CloudUpload size={22} />
          </div>

          <p className="mt-4 text-base font-semibold text-white">Drag and drop files here</p>
          <p className="mt-2 text-sm text-slate-300">PDF, JPG, JPEG, PNG, WebP supported</p>

          <button
            type="button"
            onClick={handleBrowse}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            <FileText size={14} />
            Browse files
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-300">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-2">
          <span>Supported file types</span>
          <span className="text-white">PDF, JPG, JPEG, PNG, WebP</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-2">
          <span>Maximum size</span>
          <span className="text-white">10 MB placeholder</span>
        </div>
      </div>

      {selectedFile && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">{selectedFile.name}</p>
              <p className="mt-1 text-xs text-slate-300">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/70"
              aria-label="Remove selected file"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
              <span>Upload progress</span>
              <span>{uploadState === 'uploading' ? 'Uploading' : uploadState === 'success' ? 'Complete' : uploadState === 'error' ? 'Failed' : 'Not started'}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all ${
                  uploadState === 'uploading' ? 'w-1/2' : uploadState === 'success' ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          </div>

          {uploadError && (
            <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
              {uploadError}
            </p>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploadState === 'uploading'}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadState === 'uploading' ? 'Uploading...' : 'Upload document'}
          </button>
        </div>
      )}

      {!selectedFile && (
        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
          No file selected yet. Upload state is a UI placeholder for future API integration.
        </div>
      )}
    </GlassCard>
  )
}

export default DocumentUploader
