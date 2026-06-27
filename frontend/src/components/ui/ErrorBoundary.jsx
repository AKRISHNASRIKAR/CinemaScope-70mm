import React from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const title = this.props.title || "Section unavailable";
      const message = this.props.message || "This part of CinemaScope could not be loaded. Please try again.";

      return (
        <div className="w-full py-12 px-6 flex flex-col items-center justify-center bg-surface/20 rounded-card border border-white/5 text-center" role="alert">
          <WarningAmberIcon sx={{ fontSize: 32, color: "rgba(255,255,255,0.2)", marginBottom: 1.5 }} />
          <p className="font-display font-bold text-white/70" style={{ fontSize: "1rem" }}>
            {title}
          </p>
          <p className="mt-2 max-w-sm font-body text-muted" style={{ fontSize: "0.85rem" }}>
            {message}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onRetry?.();
            }}
            className="mt-4 font-body text-gold hover:text-white transition-colors duration-fast text-xs uppercase tracking-widest border border-gold/30 px-4 py-1.5 rounded-full"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
