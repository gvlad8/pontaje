import React, { useState } from 'react';

const AddTimesheet = ({ onSubmit }) => {
  const [date, setDate] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const newTimesheet = {
      date,
      hoursWorked,
      description,
    };
    onSubmit(newTimesheet);
    setDate('');
    setHoursWorked('');
    setDescription('');
  };

  return (
    <form className="add-timesheet-form" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="date">Data:</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="hoursWorked">Ore lucrate:</label>
        <input
          type="number"
          id="hoursWorked"
          value={hoursWorked}
          onChange={(e) => setHoursWorked(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="description">Descriere:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <button type="submit">Adaugă Pontaj</button>
    </form>
  );
};

export default AddTimesheet;
