import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-[28px] border border-red-400/20 bg-slate-950/70 p-6 text-center shadow-[0_30px_80px_rgba(2,8,23,0.5)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">Error</p>
            <h2 className="mt-4 text-3xl font-bold text-white">Something went wrong</h2>
            <p className="mt-3 text-sm text-slate-300">Please try again or return to the home page.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full border border-cyan-300/35 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100"
              >
                Try Again
              </button>
              <a
                href="/"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
