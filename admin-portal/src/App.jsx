import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Logistics from './pages/Logistics'; // NEW
import Consignors from './pages/Consignors'; // NEW
import Rosters from './pages/Rosters'; // NEW
import Login from './pages/Login';
import Organizations from './pages/Organizations';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <SocketProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="trips" element={<Trips />} />
                <Route path="drivers" element={<Drivers />} />
                <Route path="users" element={<Users />} />
                <Route path="logistics" element={<Logistics />} /> {/* NEW */}
                <Route path="consignors" element={<Consignors />} /> {/* NEW */}
                <Route path="rosters" element={<Rosters />} /> {/* NEW */}
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="organizations" element={<Organizations />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
