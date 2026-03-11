import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './views/Home';
import { GroupDashboard } from './views/GroupDashboard';
import { BillOverview } from './views/BillOverview';

import { GroupDetails } from './views/GroupDetails';
import { LiveDemo } from './views/LiveDemo';

import { Login } from './views/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) return null;
  
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
}

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="fairshare-theme">
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/demo" element={<LiveDemo />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<PrivateRoute><GroupDashboard /></PrivateRoute>} />
              <Route path="/groups/:id" element={<PrivateRoute><GroupDetails /></PrivateRoute>} />
              <Route path="/bills/:id" element={<PrivateRoute><BillOverview /></PrivateRoute>} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
