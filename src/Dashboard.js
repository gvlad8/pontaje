import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Asigură-te că ai configurat Firebase corect
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import AddTimesheet from './AddTimesheet';
import TimesheetList from './TimesheetList';

const Dashboard = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchTimesheets = async () => {
      const timesheetCollection = collection(db, 'timesheets');
      const timesheetSnapshot = await getDocs(timesheetCollection);
      const timesheetList = timesheetSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTimesheets(timesheetList);
    };

    fetchTimesheets();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const toggleForm = () => setShowForm(!showForm);

  const handleAddTimesheet = (timesheet) => {
    const addTimesheetToFirestore = async () => {
      const timesheetCollection = collection(db, 'timesheets');
      await addDoc(timesheetCollection, timesheet);
      toggleForm();
    };
    addTimesheetToFirestore();
  };

  const handleDeleteTimesheet = async (id) => {
    const timesheetDoc = doc(db, 'timesheets', id);
    await deleteDoc(timesheetDoc);
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Pontaje</h1>
        <button onClick={handleSignOut}>Deconectează-te</button>
      </header>

      <div className="timesheet-actions">
        <button onClick={toggleForm}>{showForm ? 'Anulează' : 'Adaugă Pontaj'}</button>
      </div>

      {showForm && <AddTimesheet onSubmit={handleAddTimesheet} />}
      
      <TimesheetList timesheets={timesheets} onDelete={handleDeleteTimesheet} />
    </div>
  );
};

export default Dashboard;
