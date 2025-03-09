import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // UEs and groups won't become stale
      cacheTime: 1000 * 60 * 60, // Cache for 1 hour
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your existing app structure */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
