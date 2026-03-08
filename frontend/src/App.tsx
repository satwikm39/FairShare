import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './views/Home';
import { GroupDashboard } from './views/GroupDashboard';
import { BillOverview } from './views/BillOverview';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<GroupDashboard />} />
          <Route path="/groups/:id" element={<BillOverview />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
