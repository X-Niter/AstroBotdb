'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ThreeJsErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  resetAfterSeconds?: number;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ThreeJsErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component specifically for Three.js rendering errors
 * This catches WebGL context loss and other Three.js related issues
 */
class ThreeJsErrorBoundary extends Component<ThreeJsErrorBoundaryProps, ThreeJsErrorBoundaryState> {
  constructor(props: ThreeJsErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ThreeJsErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('ThreeJsErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidMount(): void {
    // Reset the error state after a specified timeout if provided
    if (this.props.resetAfterSeconds && this.state.hasError) {
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, this.props.resetAfterSeconds * 1000);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use default fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI when Three.js rendering fails
      return (
        <div className="p-4 bg-blue-900/20 backdrop-blur-sm rounded-lg border border-blue-500/30 text-white">
          <h3 className="text-xl font-semibold mb-2">3D Rendering Issue</h3>
          <p className="text-blue-200 mb-3">
            We encountered a problem rendering the 3D model. 
            This could be due to WebGL limitations in your browser or device.
          </p>
          <div className="text-xs font-mono bg-blue-950/50 p-2 rounded overflow-x-auto text-blue-300">
            {this.state.error && this.state.error.message}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ThreeJsErrorBoundary;