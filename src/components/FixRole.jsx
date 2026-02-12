import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ref, update } from 'firebase/database';
import { database } from '../config/firebase';
import { Shield, LogOut } from 'lucide-react';

const FixRole = () => {
  const { currentUser, logout, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const changeToAdmin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await update(ref(database, `users/${currentUser.uid}`), {
        role: 'admin'
      });
      
      setMessage('✅ Rol actualizado a Admin. Recarga la página (F5)');
    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Error al actualizar. Verifica la consola.');
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(255, 68, 68, 0.95)',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      color: 'white',
      maxWidth: '350px',
      zIndex: 9999
    }}>
      <h3 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Shield size={20} />
        Problema de Rol Detectado
      </h3>
      <p style={{ fontSize: '0.9rem', margin: '10px 0' }}>
        Tu cuenta está como <strong>"{userRole}"</strong> pero necesitas ser <strong>"admin"</strong>.
      </p>
      
      {message && (
        <div style={{
          padding: '10px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '6px',
          marginBottom: '10px',
          fontSize: '0.85rem'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
        <button
          onClick={changeToAdmin}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px',
            background: '#00a86b',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Actualizando...' : 'Cambiar a Admin'}
        </button>
        
        <button
          onClick={logout}
          style={{
            padding: '10px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};

export default FixRole;
