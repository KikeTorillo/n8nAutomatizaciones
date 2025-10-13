import { Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import ToastContainer from '@/components/common/ToastContainer';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Outlet />
        <ToastContainer />
      </div>
    </QueryClientProvider>
  );
}

export default App;
