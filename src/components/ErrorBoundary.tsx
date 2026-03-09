import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center shadow-card">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-black text-foreground mb-2">Oups, une erreur est survenue</h2>
            <p className="text-sm text-muted-foreground mb-4">{this.state.error?.message || 'Erreur inattendue'}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-primary"
            >
              🔄 Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
