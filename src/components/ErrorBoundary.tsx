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
        <div className="min-h-screen bg-[#0B0B0E] text-[#F3F4F6] flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full rounded-3xl bg-[#141419] border border-white/10 p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#F59E0B] flex items-center justify-center mx-auto text-2xl">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight text-white">
                {t.boundaryTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                {t.boundaryDesc}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#F59E0B] hover:bg-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
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
