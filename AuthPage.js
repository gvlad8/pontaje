// src/AuthPage.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { useHistory } from 'react-router-dom';

function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const history = useHistory();
    
    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            history.push('/dashboard');
        } catch (err) {
            setError('Autentificare eșuată! ' + err.message);
        }
    };

    const handleSignup = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Salvăm numele de utilizator în Firestore
            const user = userCredential.user;
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { username });
            history.push('/dashboard');
        } catch (err) {
            setError('Înregistrare eșuată! ' + err.message);
        }
    };

    return (
        <div>
            <h2>{username ? "Înregistrare" : "Autentificare"}</h2>
            {error && <p style={{color: 'red'}}>{error}</p>}
            {!username && (
                <>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parolă" />
                    <button onClick={handleLogin}>Autentificare</button>
                    <p>Nu ai cont? <button onClick={() => setUsername('')}>Înregistrează-te</button></p>
                </>
            )}
            {username && (
                <>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nume utilizator" />
                    <button onClick={handleSignup}>Înregistrare</button>
                </>
            )}
        </div>
    );
}

export default AuthPage;
