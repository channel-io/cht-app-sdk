import { Component, type ReactNode, type ErrorInfo } from "react";

/**
 * Props for WamErrorBoundary component
 */
export interface WamErrorBoundaryProps {
  /** Child components */
  children: ReactNode;
  /** Fallback UI to render when an error occurs */
  fallback?: ReactNode | ((error: Error) => ReactNode);
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for WamErrorBoundary component
 */
interface WamErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for WAM widgets
 *
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <WamErrorBoundary
 *       fallback={<div>Something went wrong</div>}
 *       onError={(error) => console.error('WAM error:', error)}
 *     >
 *       <MyWidget />
 *     </WamErrorBoundary>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With dynamic fallback
 * <WamErrorBoundary
 *   fallback={(error) => <div>Error: {error.message}</div>}
 * >
 *   <MyWidget />
 * </WamErrorBoundary>
 * ```
 */
export class WamErrorBoundary extends Component<WamErrorBoundaryProps, WamErrorBoundaryState> {
  constructor(props: WamErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WamErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;

      if (typeof fallback === "function") {
        return fallback(this.state.error);
      }

      return fallback ?? null;
    }

    return this.props.children;
  }
}
