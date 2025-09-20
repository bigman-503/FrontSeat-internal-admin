import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  onDismiss?: () => void;
}

export function ErrorState({ error, onRetry, onDismiss }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative">
          <AlertTriangle className="h-16 w-16 mx-auto text-red-500" />
          <div className="absolute inset-0 rounded-full border-4 border-red-200"></div>
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-gray-900">Analytics Data Unavailable</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{error}</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700">
              💡 This usually means BigQuery is not properly configured. Please check your BigQuery setup and credentials.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
          {onDismiss && (
            <Button variant="outline" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
