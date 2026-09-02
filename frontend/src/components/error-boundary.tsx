"use client"
import { Component, ReactNode } from "react"

export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="p-8 text-center text-gray-400">Something went wrong. Please try again.</div>
    }
    return this.props.children
  }
}
