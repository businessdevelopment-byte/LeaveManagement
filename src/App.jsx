import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import LeaveRequest from './pages/LeaveRequest';
import Approval from './pages/Approval';
import Setting from './pages/Setting';
import MyProfile from './pages/MyProfile';
import ProtectedRoute from './components/ProtectedRoute';
function App() {

  return (
    <div className="h-[100dvh] w-full overflow-hidden">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/leave-request" replace />} />
            <Route path="leave-request" element={<LeaveRequest />} />
            <Route path="approval" element={<Approval />} />
            <Route path="setting" element={<Setting />} />
            <Route path="my-profile" element={<MyProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;