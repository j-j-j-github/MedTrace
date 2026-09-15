import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import { PageContainer } from './components/layout/PageContainer';

import Upload from './pages/Upload';
import Records from './pages/Records';
import RecordDetails from './pages/RecordDetails';
import Timeline from './pages/Timeline';
import SharedRecords from './pages/SharedRecords';
import PublicShare from './pages/PublicShare';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import MyHealth from './pages/MyHealth';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/share/:token" element={<PublicShare />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<PageContainer />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/records" element={<Records />} />
              <Route path="/records/:id" element={<RecordDetails />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/shared" element={<SharedRecords />} />
              <Route path="/my-health" element={<MyHealth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              {/* Redirect root to dashboard if logged in */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
