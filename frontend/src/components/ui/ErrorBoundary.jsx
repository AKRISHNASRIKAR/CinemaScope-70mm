import React from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full py-12 px-6 flex flex-col items-center justify-center bg-surface/20 rounded-card border border-white/5 text-center">
          <WarningAmberIcon sx={{ fontSize: 32, color: "rgba(255,255,255,0.2)", marginBottom: 1.5 }} />
          <p className="font-body text-muted" style={{ fontSize: "0.9rem" }}>
            Failed to load section
          </p>
          {this.props.onRetry && (
            <button
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onRetry();
              }}
              className="mt-4 font-body text-gold hover:text-white transition-colors duration-fast text-xs uppercase tracking-widest border border-gold/30 px-4 py-1.5 rounded-full"
            >
              Try Again
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
