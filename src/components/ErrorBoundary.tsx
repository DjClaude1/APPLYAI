import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends (React.Component as any) {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 text-center">
          <div className="bg-destructive/10 p-6 rounded-2xl border border-destructive/20 max-w-md">
            <AlertCircle className="text-destructive mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              The application encountered an unexpected error. This might be due to a connection issue or a temporary glitch.
            </p>
            <div className="bg-background p-4 rounded-lg border text-left mb-6 overflow-auto max-h-40">
              <code className="text-xs text-destructive">{this.state.error?.message}</code>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full gap-2"
            >
              <RefreshCcw size={18} /> Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
