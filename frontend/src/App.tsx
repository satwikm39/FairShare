import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './views/Home';
import { GroupDashboard } from './views/GroupDashboard';
import { BillOverview } from './views/BillOverview';
import { GroupDetails } from './views/GroupDetails';
import { LiveDemo } from './views/LiveDemo';
import { Login } from './views/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { BugViewer } from './views/Admin/BugViewer';
import { About } from './views/About';
import { isDemoMode } from './config/demo';


function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) return null;

  if (isDemoMode()) return <>{children}</>;

  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) return null;

  if (!currentUser) return <Navigate to="/login" replace />;
  
  if (currentUser.is_admin !== 1) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/demo', element: <LiveDemo /> },
      { path: '/login', element: <Login /> },
      {
        path: '/dashboard',
        element: (
          <PrivateRoute>
            <GroupDashboard />
          </PrivateRoute>
        ),
      },
      {
        path: '/groups/:id',
        element: (
          <PrivateRoute>
            <GroupDetails />
          </PrivateRoute>
        ),
      },
      {
        path: '/bills/:id',
        element: (
          <PrivateRoute>
            <BillOverview />
          </PrivateRoute>
        ),
      },
       {
        path: '/admin/bugs',
        element: (
          <AdminRoute>
            <BugViewer />
          </AdminRoute>
        ),
      },
      { path: '/about', element: <About /> },

    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  } as any,
});

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="fairshare-theme">
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true } as any} />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
