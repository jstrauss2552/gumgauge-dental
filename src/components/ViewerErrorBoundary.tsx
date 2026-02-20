import React from "react";

interface ViewerErrorBoundaryProps {
  children: React.ReactNode;
  /** Fallback UI when an error is caught. Can be a node or a function (error) => node to show the error. */
  fallback: React.ReactNode | ((error: Error | null) => React.ReactNode);
}

interface ViewerErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/** Catches errors in the 3D viewer so the rest of the page (e.g. 2D map) still works. */
export default class ViewerErrorBoundary extends React.Component<ViewerErrorBoundaryProps, ViewerErrorBoundaryState> {
  constructor(props: ViewerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ViewerErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("3D viewer error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error);
      }
      return this.props.fallback;
    }
    return this.props.children;
  }
}
