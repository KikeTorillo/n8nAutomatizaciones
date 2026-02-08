import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import ChunkErrorBoundary from '@/components/common/ChunkErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChunkErrorBoundary>
      <RouterProvider router={router} />
    </ChunkErrorBoundary>
  </StrictMode>
);
