import React from 'react';

function TestApp() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '2rem',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>⚽ Tu Penca Al Toque</h1>
        <p style={{ fontSize: '1rem', marginTop: '20px' }}>
          Si ves esto, React está funcionando ✅
        </p>
      </div>
    </div>
  );
}

export default TestApp;
