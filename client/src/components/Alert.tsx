import React from 'react';

export interface AlertProps {
  type?: 'danger' | 'success' | 'warning' | 'info';
  message?: string | null;
  errors?: Array<{ field?: string; message: string }>;
}

export const Alert: React.FC<AlertProps> = ({ type = 'danger', message, errors = [] }) => {
  if (!message && (!errors || errors.length === 0)) return null;

  return (
    <div className={`alert alert-${type}`}>
      {message && <div>{message}</div>}
      {errors && errors.length > 0 && (
        <ul style={{ marginTop: '6px', paddingLeft: '20px' }}>
          {errors.map((err, idx) => (
            <li key={idx}>
              {err.field ? <strong>{err.field}: </strong> : null}
              {err.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
