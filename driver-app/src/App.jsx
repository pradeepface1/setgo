import { useState, useEffect } from 'react';
import Login from './components/Login';
import TripList from './components/TripList';
import './App.css';

function App() {
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    // Check if driver is already logged in
    const storedDriver = localStorage.getItem('driver');
    if (storedDriver) {
      setDriver(JSON.parse(storedDriver));
    }
  }, []);

  const handleLogin = (driverData) => {
    setDriver(driverData);
  };

  const handleLogout = () => {
    setDriver(null);
  };

  if (!driver) {
    return <Login onLogin={handleLogin} />;
  }

  return <TripList driver={driver} onLogout={handleLogout} />;
}

export default App;
