'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches render errors in child components.
 * Prevents full-page crashes and shows a user-friendly fallback.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in dev, could be sent to an error tracking service
    console.error('[ErrorBoundary]', error.message, errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Une erreur est survenue / An error occurred
            </h2>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4">
              Veuillez réessayer. Si le problème persiste, contactez le support.
              <br />
              Please try again. If the issue persists, contact support.
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer / Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper for API fetch calls with consistent error handling.
 * Use in client components to call API routes safely.
 */
export async function safeFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        data: null,
        error: body?.error || `Erreur ${res.status}`,
        status: res.status,
      };
    }

    return { data: body as T, error: null, status: res.status };
  } catch {
    return {
      data: null,
      error: 'Erreur réseau. Vérifiez votre connexion. / Network error. Check your connection.',
      status: 0,
    };
  }
}

export default ErrorBoundary;
