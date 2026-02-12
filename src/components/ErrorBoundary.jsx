import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (event) => {
      console.error('Error detectado:', event.error);
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <AlertCircle size={64} color="#ff4444" />
        <h1 style={{ marginTop: '20px' }}>Error al cargar la aplicación</h1>
        <p style={{ color: '#b4b4b4', maxWidth: '500px', marginTop: '10px' }}>
          {error?.message || 'Verifica tu conexión a Firebase'}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: '#00a86b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <RefreshCw size={20} />
          Reintentar
        </button>
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          maxWidth: '600px',
          textAlign: 'left',
          fontSize: '0.9rem'
        }}>
          <strong>Verifica:</strong>
          <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
            <li>Que la Realtime Database esté creada en Firebase</li>
            <li>Que la URL en firebase.js sea correcta</li>
            <li>Que las reglas de Firebase permitan acceso</li>
            <li>Tu conexión a internet</li>
          </ul>
        </div>
      </div>
    );
  }

  return children;
};

export default ErrorBoundary;
