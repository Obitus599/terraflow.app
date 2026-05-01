"use client";

import { Component, type ReactNode } from "react";

interface Props {
  label: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class InlineErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[inline-error-boundary]", this.props.label, error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-danger">
          Render error · {this.props.label}
        </p>
        <p className="mt-2 font-display text-sm text-text">
          {this.state.error.message || "(no message)"}
        </p>
        {this.state.error.stack ? (
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md border border-line bg-bg-2 p-3 text-[11px] text-text-3">
            {this.state.error.stack}
          </pre>
        ) : null}
      </div>
    );
  }
}
