import { createBrowserRouter } from 'react-router-dom';
import App from './App';

// Lazy loading de páginas
import { lazy, Suspense } from 'react';

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Lazy load de páginas
const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/Login'));
const OnboardingFlow = lazy(() => import('@/pages/onboarding/OnboardingFlow'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));

// Wrapper para lazy loading
const withSuspense = (Component) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: withSuspense(LandingPage),
      },
      {
        path: 'login',
        element: withSuspense(LoginPage),
      },
      {
        path: 'onboarding',
        element: withSuspense(OnboardingFlow),
      },
      {
        path: 'dashboard',
        element: withSuspense(Dashboard),
      },
    ],
  },
]);
