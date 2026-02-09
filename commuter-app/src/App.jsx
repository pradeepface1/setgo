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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-lg font-bold text-jubilant-600">Jubilant Commuter</h1>
        <button
          onClick={() => setActiveTab(activeTab === 'request' ? 'history' : 'request')}
          className="flex items-center px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          {activeTab === 'request' ? (
            <>
              <History className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">History</span>
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">New Trip</span>
            </>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-6 overflow-y-auto">
        {activeTab === 'request' ? (
          <TripRequestForm onTripCreated={() => setActiveTab('history')} />
        ) : (
          <TripHistory />
        )}
      </main>
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
