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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) return null;

  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
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
          <PrivateRoute>
            <BugViewer />
          </PrivateRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="fairshare-theme">
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
