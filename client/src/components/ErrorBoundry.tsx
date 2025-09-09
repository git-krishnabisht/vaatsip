import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRetrying: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isRetrying: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      isRetrying: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    this.logErrorToService(error, errorInfo);
  }

  public componentWillUnmount() {
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you'd send this to your error monitoring service
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error("Error logged:", errorData);
  };

  private handleRetry = () => {
    this.setState({ isRetrying: true });

    this.retryTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
      });
    }, 1000);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Check if we're in development mode
      const isDevelopment =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "";

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 border-b border-red-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-red-800">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-red-600 mt-1">
                    We encountered an unexpected error
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 leading-relaxed">
                <p>
                  Don't worry, this happens sometimes. You can try refreshing
                  the page or going back to the home screen.
                </p>
              </div>

              {/* Error Details (Development only) */}
              {isDevelopment && this.state.error && (
                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Bug className="w-3 h-3" />
                      <span>Technical details (dev mode)</span>
                    </div>
                  </summary>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-mono text-gray-700 space-y-2">
                      <div>
                        <span className="font-semibold">Error:</span>
                        <div className="mt-1 text-red-600">
                          {this.state.error.message}
                        </div>
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <span className="font-semibold">Stack:</span>
                          <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 pt-4">
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      this.state.isRetrying ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {this.state.isRetrying ? "Retrying..." : "Try Again"}
                  </span>
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center space-x-2 flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>Go Home</span>
                  </button>

                  <button
                    onClick={this.handleReload}
                    className="flex items-center justify-center space-x-2 flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reload</span>
                  </button>
                </div>
              </div>

              {/* Support Info */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  If this problem persists, please contact our support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
