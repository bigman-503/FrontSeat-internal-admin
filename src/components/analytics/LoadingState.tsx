import React from 'react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export function LoadingState({ 
  message = "Loading analytics data...", 
  subMessage = "Fetching device heartbeat data from BigQuery" 
}: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">{message}</p>
          <p className="text-sm text-muted-foreground">{subMessage}</p>
          <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
