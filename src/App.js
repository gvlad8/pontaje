import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase'; // Importă autentificarea Firebase
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';
import Login from './Login';
import Signup from './Signup';
import './App.css';
import { signOut } from 'firebase/auth'; // Dacă vrei să adaugi funcționalitate de logout

function App() {
  const [user, setUser] = useState(null); // Stocăm utilizatorul autentificat
  const [loading, setLoading] = useState(true); // Stocăm statusul de încărcare

  useEffect(() => {
    // Ascultăm schimbările de autentificare
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user); // Actualizăm starea cu utilizatorul
      setLoading(false); // Oprim încărcarea când avem răspunsul
    });
    
    return () => unsubscribe(); // Curățăm când componenta se dezasociază
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Poți înlocui cu un loading spinner dacă vrei
  }

  return (
    <Router>
      <Routes>
        {/* Rute pentru login și signup */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Redirecționăm utilizatorul în funcție de starea de autentificare */}
        <Route 
          path="/" 
          element={user ? (
            user.uid === 'f6CQGIWFhUepX6szme5GdzvEZ8W2' ? ( // Admin
              <AdminDashboard />
            ) : ( // User
              <UserDashboard />
            )
          ) : (
            <Navigate to="/login" replace /> // Dacă nu ești autentificat, redirecționează la login
          )}
        />
      </Routes>
    </Router>
  );
}

export default App;
