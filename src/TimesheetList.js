import React from 'react';

const TimesheetList = ({ timesheets, onDelete }) => {
  return (
    <div className="timesheet-list">
      <h2>Pontaje</h2>
      {timesheets.length === 0 ? (
        <p>Nu sunt pontaje.</p>
      ) : (
        <ul>
          {timesheets.map((timesheet) => (
            <li key={timesheet.id} className="timesheet-item">
              <div>
                <strong>{timesheet.date}</strong> - {timesheet.hoursWorked} ore lucrate
              </div>
              <div>{timesheet.description}</div>
              <button onClick={() => onDelete(timesheet.id)}>Șterge</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TimesheetList;
