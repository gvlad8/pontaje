// src/Signup.js
import React, { useState } from 'react';
import { auth, db } from './firebase'; // Asigură-te că ai configurat corect Firebase
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate              = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Obține UID-ul noului utilizator și salvează numele în Firestore
      const uid = userCredential.user.uid;
      await setDoc(doc(db, 'users', uid), { 
        username: username, 
        email: email,
        role: 'user'
      });
      alert('Cont creat cu succes!');
      navigate('/'); // Redirecționează la dashboard după signup
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h1>Sign Up</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSignup}>
        <div>
          <label>Nume utilizator</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
      <p>Ai deja cont? <a href="/login">Autentifică-te aici</a></p>
    </div>
  );
}

export default Signup;
