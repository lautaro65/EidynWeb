"use client";
import React from 'react';

interface Props {
  children: React.ReactNode;
  translations?: {
    errorLoading: string;
    errorUnknown: string;
    retry: string;
  };
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { translations } = this.props;
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20">
          <svg className="w-12 h-12 mb-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-bold mb-2">{translations?.errorLoading || "Error al cargar el modelo 3D"}</h3>
          <p className="text-sm opacity-80 max-w-md mx-auto mb-4">{this.state.error?.message || translations?.errorUnknown || 'Error desconocido. Revisa la consola para más detalles.'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            {translations?.retry || "Reintentar"}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
