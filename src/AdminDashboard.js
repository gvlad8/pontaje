// src/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const AdminDashboard = () => {
  const [activeTimesheets, setActiveTimesheets] = useState([]);
  const [aggregatedHours, setAggregatedHours] = useState({});
  const [error, setError] = useState(null);
  
  // UID-ul adminului
  const adminUid = 'f6CQGIWFhUepX6szme5GdzvEZ8W2';
  const user = auth.currentUser;

  useEffect(() => {
    if (user && user.uid === adminUid) {
      fetchActiveTimesheets();
      fetchAggregatedHours();
    }
  }, [user]);

  // Secțiunea 1: Pontaje Active
  const fetchActiveTimesheets = async () => {
    try {
      // Interogăm doar pontajele active
      const q = query(collection(db, 'timesheets'), where('active', '==', true));
      const snapshot = await getDocs(q);
      const timesheets = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Construim o mapare: userId => username
      const userMap = {};
      for (const ts of timesheets) {
        if (!userMap[ts.userId]) {
          const userDoc = await getDoc(doc(db, 'users', ts.userId));
          userMap[ts.userId] = userDoc.exists() ? userDoc.data().username : ts.userId;
        }
      }
      
      // Adăugăm câmpul "username" în fiecare pontaj
      const enrichedTimesheets = timesheets.map(ts => ({
        ...ts,
        username: userMap[ts.userId],
      }));
      
      setActiveTimesheets(enrichedTimesheets);
    } catch (err) {
      setError("Eroare la încărcarea pontajelor active: " + err.message);
    }
  };

  const stopAdminPontaj = async (timesheetId) => {
    try {
      const tsRef = doc(db, 'timesheets', timesheetId);
      await updateDoc(tsRef, { active: false, endTime: new Date() });
      fetchActiveTimesheets();
      fetchAggregatedHours();
    } catch (err) {
      setError("Eroare la închiderea pontajului: " + err.message);
    }
  };

  // Secțiunea 2: Aggregate ore pe ultimele 3 săptămâni
  const fetchAggregatedHours = async () => {
    try {
      const now = new Date();
      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(now.getDate() - 21); // Ultimele 3 săptămâni
      
      // Interogăm toate pontajele din ultimele 3 săptămâni
      const q = query(collection(db, 'timesheets'), where('startTime', '>=', threeWeeksAgo));
      const snapshot = await getDocs(q);
      const timesheets = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      // Luăm doar pontajele care au endTime (adică finalizate)
      const closedTimesheets = timesheets.filter(ts => ts.endTime);

      // Grupăm pontajele pe utilizator și pe săptămână (calculăm începutul săptămânii, considerând că începe luni)
      const aggregation = {}; // Structură: { userId: { weekKey: totalHours } }
      closedTimesheets.forEach(ts => {
        const startTime = ts.startTime.toDate();
        const endTime = ts.endTime.toDate();
        const duration = (endTime - startTime) / (1000 * 3600); // Durata în ore

        // Calculăm începutul săptămânii pentru pontaj
        const weekStart = new Date(startTime);
        const day = weekStart.getDay();
        const offset = day === 0 ? -6 : 1 - day;
        weekStart.setDate(weekStart.getDate() + offset);
        const weekKey = weekStart.toISOString().slice(0, 10); // Format: "YYYY-MM-DD"

        if (!aggregation[ts.userId]) {
          aggregation[ts.userId] = {};
        }
        if (!aggregation[ts.userId][weekKey]) {
          aggregation[ts.userId][weekKey] = 0;
        }
        aggregation[ts.userId][weekKey] += duration;
      });

      // Pentru fiecare user, înlocuim userId cu numele de utilizator
      const aggregatedWithUsername = {};
      for (const uid in aggregation) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        const username = userDoc.exists() ? userDoc.data().username : uid;
        aggregatedWithUsername[username] = aggregation[uid];
      }

      setAggregatedHours(aggregatedWithUsername);
    } catch (err) {
      setError("Eroare la calcularea orelor agregate: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setError("Eroare la deconectare: " + err.message);
    }
  };

  if (!user || user.uid !== adminUid) {
    return <h1>Acces Refuzat. Nu aveți permisiunea de a accesa acest dashboard.</h1>;
  }

  return (
    <div style={{ padding: '20px' }}>
<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h1>Dashboard Admin</h1>
  <button onClick={handleLogout}>Log Out</button>  {/* Un singur buton de log-out */}
</header>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Secțiunea de Pontaje Active */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Pontaje Active</h2>
        {activeTimesheets.length === 0 ? (
          <p>Nu există pontaje active.</p>
        ) : (
          <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Acțiune</th>
              </tr>
            </thead>
            <tbody>
              {activeTimesheets.map(ts => (
                <tr key={ts.id}>
                  <td>{ts.username}</td>
                  <td>{new Date(ts.startTime.seconds * 1000).toLocaleString()}</td>
                  <td>{ts.endTime ? new Date(ts.endTime.seconds * 1000).toLocaleString() : 'În curs'}</td>
                  <td>
                    {ts.active && (
                      <button onClick={() => stopAdminPontaj(ts.id)}>Închide Pontaj</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Secțiunea de Ore Agregate pe Utilizator pentru Ultimele 3 Săptămâni */}
      <section>
        <h2>Total Ore pe Utilizator - Ultimele 3 Săptămâni</h2>
        {Object.keys(aggregatedHours).length === 0 ? (
          <p>Nu există date de pontaj pentru ultimele 3 săptămâni.</p>
        ) : (
          <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Ultima Săptămână</th>
                <th>Penița Săptămână</th>
                <th>Antepenultimă Săptămână</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(aggregatedHours).map(username => {
                // Sortează săptămânile descrescător (cele mai recente mai întâi)
                const weeks = Object.keys(aggregatedHours[username]).sort().reverse();
                // Extrage ultimele 3 săptămâni (dacă există)
                const week1 = weeks[0] || '-';
                const week2 = weeks[1] || '-';
                const week3 = weeks[2] || '-';
                return (
                  <tr key={username}>
                    <td>{username}</td>
                    <td>{week1 !== '-' ? aggregatedHours[username][week1].toFixed(2) + " ore" : '-'}</td>
                    <td>{week2 !== '-' ? aggregatedHours[username][week2].toFixed(2) + " ore" : '-'}</td>
                    <td>{week3 !== '-' ? aggregatedHours[username][week3].toFixed(2) + " ore" : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
