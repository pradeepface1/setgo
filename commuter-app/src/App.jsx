import { AuthProvider, useAuth } from './context/AuthContext';
import TripRequestForm from './components/TripRequestForm';
import Login from './components/Login';
import './App.css';

import { useState } from 'react';
import TripHistory from './components/TripHistory';
import { PlusCircle, History } from 'lucide-react';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('request');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-jubilant-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="trip-list-container">
      {/* Header */}
      <div className="header">
        <div>
          <h1>SetGo</h1>
          <p className="driver-name">Welcome, {user.username || 'Commuter'}</p>
        </div>
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="trips-section">
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'request' ? 'active' : ''}`}
            onClick={() => setActiveTab('request')}
          >
            Request Ride
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {activeTab === 'request' ? (
          <TripRequestForm onTripCreated={() => setActiveTab('history')} />
        ) : (
          <TripHistory />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
