import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CreateRFP from './pages/CreateRFP'
import VendorManagement from './pages/VendorManagement'
import Proposals from './pages/Proposals'
import Comparison from './pages/Comparison'
import RFPDetail from './pages/RFPDetail'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create-rfp" element={<CreateRFP />} />
          <Route path="/rfps/:id" element={<RFPDetail />} />
          <Route path="/vendors" element={<VendorManagement />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/comparison/:rfpId" element={<Comparison />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

