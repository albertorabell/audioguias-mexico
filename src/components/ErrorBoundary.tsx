import React, { ReactNode } from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import { getStrings } from '../i18n';
import { getCurrentLanguage } from '../i18n/runtime';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };
  public props!: ErrorBoundaryProps;

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.hash = '';
      window.location.reload();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const t = getStrings(getCurrentLanguage()).errors;

      return (
        <div className="min-h-dvh bg-bg text-ink flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full rounded-3xl bg-surface border border-line p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-raised text-tezontle flex items-center justify-center mx-auto text-2xl">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight text-ink">
                {t.boundaryTitle}
              </h2>
              <p className="text-ui text-ink-2 leading-relaxed">
                {t.boundaryDesc}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn-primary w-full"
              >
                <Home className="w-4 h-4 fill-current" />
                <span>{t.boundaryButton}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
