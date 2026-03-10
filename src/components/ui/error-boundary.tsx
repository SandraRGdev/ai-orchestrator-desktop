import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <div className="text-center space-y-6 max-w-lg">
            <div className="text-7xl">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Algo salió mal
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {this.state.error?.message || 'Ocurrió un error inesperado'}
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left">
              <p className="text-sm text-red-800 dark:text-red-300 font-mono text-xs overflow-auto max-h-32">
                {this.state.error?.stack}
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Recargar aplicación
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Reintentar
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Si el problema persiste, reporta el error en GitHub.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
