// src/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const AdminDashboard = () => {
  const [activeTimesheets, setActiveTimesheets] = useState([]);
  const [aggregatedHours, setAggregatedHours] = useState({});
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const adminUid = 'f6CQGIWFhUepX6szme5GdzvEZ8W2';
  const user = auth.currentUser;

  useEffect(() => {
    if (user && user.uid === adminUid) {
      fetchActiveTimesheets();
      fetchAggregatedHours();
      fetchUsers();
    }
  }, [user]);

  const fetchActiveTimesheets = async () => {
    try {
      const q = query(collection(db, 'timesheets'), where('active', '==', true));
      const snapshot = await getDocs(q);
      const timesheets = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      const userMap = {};
      for (const ts of timesheets) {
        if (!userMap[ts.userId]) {
          const userDoc = await getDoc(doc(db, 'users', ts.userId));
          userMap[ts.userId] = userDoc.exists() ? userDoc.data().username : ts.userId;
        }
      }

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

  const fetchAggregatedHours = async () => {
    try {
      const now = new Date();
      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(now.getDate() - 21);
      const q = query(collection(db, 'timesheets'), where('startTime', '>=', threeWeeksAgo));
      const snapshot = await getDocs(q);
      const timesheets = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      const closedTimesheets = timesheets.filter(ts => ts.endTime);

      const aggregation = {};
      closedTimesheets.forEach(ts => {
        const startTime = ts.startTime.toDate();
        const endTime = ts.endTime.toDate();
        const duration = (endTime - startTime) / (1000 * 3600);

        const weekStart = new Date(startTime);
        const day = weekStart.getDay();
        const offset = day === 0 ? -6 : 1 - day;
        weekStart.setDate(weekStart.getDate() + offset);
        const weekKey = weekStart.toISOString().slice(0, 10);

        if (!aggregation[ts.userId]) aggregation[ts.userId] = {};
        if (!aggregation[ts.userId][weekKey]) aggregation[ts.userId][weekKey] = 0;
        aggregation[ts.userId][weekKey] += duration;
      });

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

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
    } catch (err) {
      setError("Eroare la încărcarea utilizatorilor: " + err.message);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setError("Eroare la ștergerea utilizatorului: " + err.message);
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
        <button onClick={handleLogout}>Logout</button>
      </header>

      {error && <p style={{ color: 'red' }}>{error}</p>}

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

      <section style={{ marginBottom: '40px' }}>
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
                const weeks = Object.keys(aggregatedHours[username]).sort().reverse();
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

      <section>
        <h2>Utilizatori</h2>
        {users.length === 0 ? (
          <p>Nu există utilizatori.</p>
        ) : (
          <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Acțiune</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td><button onClick={() => deleteUser(u.id)}>Șterge</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
