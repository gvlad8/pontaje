import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { signOut } from 'firebase/auth'; // Folosește pentru a ieși din cont
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';
import Login from './Login';
import Signup from './Signup';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.log("Eroare la deconectare: ", err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div>
        {user && <button onClick={handleLogout}>Log Out</button>} {/* Buton de logout */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/" 
            element={user ? (
              user.uid === 'f6CQGIWFhUepX6szme5GdzvEZ8W2' ? <AdminDashboard /> : <UserDashboard />
            ) : (
              <Navigate to="/login" replace />
            )}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
