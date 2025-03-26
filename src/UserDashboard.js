import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';  // Asigură-te că ai configurat corect Firebase
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const UserDashboard = () => {
  const [pontajInceput, setPontajInceput] = useState(false);
  const [pontajStart, setPontajStart] = useState(null);
  const [istoricPontaje, setIstoricPontaje] = useState([]);
  const [oreSaptamanaCurenta, setOreSaptamanaCurenta] = useState(0);
  const [error, setError] = useState(null);
  const user = auth.currentUser;  // Utilizatorul autentificat

  // Functiile trebuie definite mai sus
  const fetchIstoricPontaje = async () => {
    try {
      const q = query(collection(db, 'timesheets'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const pontaje = querySnapshot.docs.map(doc => doc.data());
      setIstoricPontaje(pontaje);
    } catch (err) {
      setError("Eroare la încărcarea istoricului de pontaje: " + err.message);
    }
  };

  const calculeazaOreSaptamanaCurenta = async () => {
    try {
      const startOfWeek = new Date();
      const day = startOfWeek.getDay();  // 0 = Duminică, 1 = Luni, etc.
      const offset = day === 0 ? -6 : 1 - day;
      startOfWeek.setDate(startOfWeek.getDate() + offset);

      const q = query(
        collection(db, 'timesheets'),
        where('userId', '==', user.uid),
        where('startTime', '>=', startOfWeek)
      );
      const querySnapshot = await getDocs(q);

      let oreTotale = 0;
      querySnapshot.forEach(doc => {
        const pontaj = doc.data();
        if (pontaj.startTime && pontaj.endTime) {
          const start = pontaj.startTime.toDate();
          const stop = pontaj.endTime.toDate();
          const durata = (stop - start) / (1000 * 3600); // Calcul în ore
          oreTotale += durata;
        }
      });
      setOreSaptamanaCurenta(oreTotale);
    } catch (err) {
      setError("Eroare la calcularea orelor din săptămâna curentă: " + err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchIstoricPontaje();
      calculeazaOreSaptamanaCurenta();
    }
  }, [user, calculeazaOreSaptamanaCurenta, fetchIstoricPontaje]); // Dependență pe user

  const incepePontaj = async () => {
    try {
      const startTime = new Date();
      setPontajInceput(true);
      setPontajStart(startTime);
      await addDoc(collection(db, 'timesheets'), {
        userId: user.uid,
        startTime: startTime,
        endTime: null,
        date: startTime.toISOString(),
        active: true
      });
      fetchIstoricPontaje();
    } catch (err) {
      setError("Eroare la începerea pontajului: " + err.message);
    }
  };

  const oprestePontaj = async () => {
    try {
      const stopTime = new Date();
      setPontajInceput(false);
      const pontajRef = collection(db, 'timesheets');
      const q = query(
        pontajRef,
        where('userId', '==', user.uid),
        where('startTime', '==', pontajStart)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (docSnap) => {
        await updateDoc(doc(db, 'timesheets', docSnap.id), {
          endTime: stopTime,
          active: false
        });
      });
      fetchIstoricPontaje();
      calculeazaOreSaptamanaCurenta();
    } catch (err) {
      setError("Eroare la oprirea pontajului: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setError("Eroare la deconectare: " + err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h1>Dashboard Utilizator</h1>
  <button onClick={handleLogout}>Log Out</button>  {/* Un singur buton de log-out */}
</header>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h2>Ore în săptămâna curentă: {oreSaptamanaCurenta.toFixed(2)} ore</h2>
      <div>
        {!pontajInceput ? (
          <button onClick={incepePontaj}>Începe Pontaj</button>
        ) : (
          <button onClick={oprestePontaj}>Oprește Pontaj</button>
        )}
      </div>
      <h3>Istoric Pontaje</h3>
      <ul>
        {istoricPontaje.map((pontaj, index) => (
          <li key={index}>
            {new Date(pontaj.startTime.seconds * 1000).toLocaleString()} - {pontaj.endTime ? new Date(pontaj.endTime.seconds * 1000).toLocaleString() : 'În curs'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserDashboard;
