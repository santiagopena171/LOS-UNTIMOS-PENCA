import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (username, password, displayName, role) => {
    console.log('signup - parámetro rol recibido:', role);
    // Convertir username a formato email para Firebase Auth
    const email = `${username.toLowerCase().trim()}@pencas.app`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userData = {
      username: username.toLowerCase().trim(),
      displayName: displayName,
      role: role, // 'admin' o 'user'
      createdAt: Date.now()
    };
    console.log('signup - guardando en DB:', userData);
    
    // Guardar datos del usuario en Realtime Database
    await set(ref(database, `users/${user.uid}`), userData);
    // Guardar mapping de username a uid para búsquedas
    await set(ref(database, `usernames/${username.toLowerCase().trim()}`), user.uid);
    console.log('signup - usuario guardado exitosamente con rol:', role);
    
    return user;
  };

  const login = (username, password) => {
    // Convertir username a formato email para Firebase Auth
    const email = `${username.toLowerCase().trim()}@pencas.app`;
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    console.log('AuthContext: Iniciando...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: Usuario detectado:', user?.email || 'No autenticado');
      setCurrentUser(user);
      
      if (user) {
        try {
          console.log('AuthContext: Obteniendo rol del usuario...');
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const role = snapshot.val().role;
            console.log('AuthContext: Rol cargado:', role);
            setUserRole(role);
          } else {
            console.error('AuthContext: Usuario no tiene datos en DB');
            setUserRole('user'); // Rol por defecto
          }
        } catch (error) {
          console.error('AuthContext: Error loading user role:', error);
          setUserRole('user'); // Rol por defecto en caso de error
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
      console.log('AuthContext: Carga completada');
    }, (error) => {
      console.error('AuthContext: Error en onAuthStateChanged:', error);
      setLoading(false);
    });

    // Timeout de seguridad por si Firebase no responde
    const timeout = setTimeout(() => {
      console.warn('AuthContext: Timeout - cargando sin Firebase');
      setLoading(false);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    logout
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
        gap: '20px'
      }}>
        <div className="spinner"></div>
        <p>Cargando Tu Penca Al Toque...</p>
        <small style={{ color: '#b4b4b4' }}>Iniciando sesión...</small>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
