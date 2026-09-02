'use client'
import { Component, ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-6 text-center bg-gray-800 rounded-lg">
          <p className="text-gray-300 mb-4">Something went wrong. Please try again.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-blue-600 rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
