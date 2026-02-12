import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, get, set } from 'firebase/database';
import { database } from '../../config/firebase';
import { LogOut, Trophy, TrendingUp } from 'lucide-react';
import ViewPenca from './ViewPenca';
import './User.css';

const UserDashboard = () => {
  const { logout, currentUser } = useAuth();
  const [myPencas, setMyPencas] = useState([]);
  const [availablePencas, setAvailablePencas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPenca, setSelectedPenca] = useState(null);

  useEffect(() => {
    loadPencas();
    checkInviteLink();
  }, [currentUser]);

  const loadPencas = async () => {
    try {
      const pencasRef = ref(database, 'pencas');
      const snapshot = await get(pencasRef);
      
      if (snapshot.exists()) {
        const allPencas = snapshot.val();
        
        // Filtrar pencas donde el usuario es participante
        const joined = [];
        const available = [];
        
        for (const key of Object.keys(allPencas)) {
          const penca = { id: key, ...allPencas[key] };
          
          // Verificar si el admin existe
          if (penca.adminId) {
            const adminRef = ref(database, `users/${penca.adminId}`);
            const adminSnapshot = await get(adminRef);
            if (!adminSnapshot.exists()) {
              console.log('Ocultando penca con admin inexistente:', penca.name);
              continue; // Saltar pencas cuyo admin ya no existe
            }
          }
          
          if (penca.participants && penca.participants[currentUser.uid]) {
            joined.push(penca);
          } else {
            // Verificar si ya tiene solicitud pendiente
            const hasPendingRequest = penca.pendingRequests && penca.pendingRequests[currentUser.uid];
            available.push({ ...penca, hasPendingRequest });
          }
        }
        
        setMyPencas(joined);
        setAvailablePencas(available);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading pencas:', error);
      setLoading(false);
    }
  };

  const checkInviteLink = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get('invite');
    
    if (inviteId) {
      await joinPenca(inviteId);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const requestToJoin = async (pencaId) => {
    try {
      const pencaRef = ref(database, `pencas/${pencaId}`);
      const snapshot = await get(pencaRef);
      
      if (!snapshot.exists()) {
        alert('Esta penca no existe');
        return;
      }

      const penca = snapshot.val();
      
      // Verificar si ya está unido
      if (penca.participants && penca.participants[currentUser.uid]) {
        alert('Ya estás participando en esta penca');
        return;
      }

      // Verificar si ya tiene solicitud pendiente
      if (penca.pendingRequests && penca.pendingRequests[currentUser.uid]) {
        alert('Ya tienes una solicitud pendiente para esta penca');
        return;
      }

      // Crear solicitud de unión
      const userRef = ref(database, `users/${currentUser.uid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val();

      await set(ref(database, `pencas/${pencaId}/pendingRequests/${currentUser.uid}`), {
        displayName: userData.displayName,
        username: userData.username,
        requestedAt: Date.now(),
        status: 'pending'
      });

      alert('¡Solicitud enviada! El administrador revisará tu solicitud.');
      loadPencas();
    } catch (error) {
      console.error('Error requesting to join:', error);
      alert('Error al enviar solicitud');
    }
  };

  const joinPenca = async (pencaId) => {
    await requestToJoin(pencaId);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (selectedPenca) {
    return (
      <ViewPenca 
        penca={selectedPenca} 
        onBack={() => {
          setSelectedPenca(null);
          loadPencas();
        }} 
      />
    );
  }

  return (
    <div className="user-container">
      <header className="user-header">
        <div className="container">
          <div className="flex justify-between items-center">
            <div>
              <h1>⚽ Mis Pencas</h1>
              <p className="text-secondary">Haz tus predicciones y compite</p>
            </div>
            <button onClick={handleLogout} className="btn btn-outline">
              <LogOut size={20} />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <>
            {/* Pencas disponibles para unirse */}
            {availablePencas.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>📋 Pencas Disponibles</h2>
                <div className="grid grid-2">
                  {availablePencas.map(penca => (
                    <div key={penca.id} className="penca-card-user card">
                      <div className="penca-card-header">
                        <h3>{penca.name}</h3>
                        <span className="badge">
                          {penca.status === 'active' ? '✅ Activa' : '⏸️ Inactiva'}
                        </span>
                      </div>
                      
                      <p className="penca-description">{penca.description}</p>
                      
                      <div className="user-stats">
                        <div className="stat-box">
                          <div className="stat-value">{Object.keys(penca.participants || {}).length}</div>
                          <div className="stat-label">Jugadores</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{Object.keys(penca.teams || {}).length}</div>
                          <div className="stat-label">Equipos</div>
                        </div>
                      </div>

                      {penca.hasPendingRequest ? (
                        <button className="btn btn-outline btn-full" disabled>
                          ⏳ Solicitud Pendiente
                        </button>
                      ) : (
                        <button 
                          onClick={() => requestToJoin(penca.id)}
                          className="btn btn-primary btn-full"
                        >
                          ➕ Solicitar Unirse
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mis pencas */}
            <div>
              <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>⚽ Mis Pencas</h2>
              {myPencas.length === 0 ? (
                <div className="empty-state">
                  <Trophy size={64} className="text-secondary" />
                  <h2>No estás en ninguna penca</h2>
                  <p className="text-secondary">
                    Solicita unirte a una penca disponible arriba
                  </p>
                </div>
              ) : (
                <div className="grid grid-2">
                  {myPencas.map(penca => {
              const myData = penca.participants?.[currentUser.uid];
              const totalParticipants = Object.keys(penca.participants || {}).length;
              
              // Calcular posición
              const sortedParticipants = Object.entries(penca.participants || {})
                .sort((a, b) => (b[1].points || 0) - (a[1].points || 0));
              const myPosition = sortedParticipants.findIndex(([id]) => id === currentUser.uid) + 1;

              return (
                <div key={penca.id} className="penca-card-user card">
                  <div className="penca-card-header">
                    <h3>{penca.name}</h3>
                    <span className="badge">
                      {penca.status === 'active' ? '✅ Activa' : '⏸️ Inactiva'}
                    </span>
                  </div>
                  
                  <p className="penca-description">{penca.description}</p>
                  
                  <div className="user-stats">
                    <div className="stat-box">
                      <div className="stat-value">{myData?.points || 0}</div>
                      <div className="stat-label">Puntos</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-value">#{myPosition}</div>
                      <div className="stat-label">Posición</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-value">{totalParticipants}</div>
                      <div className="stat-label">Jugadores</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedPenca(penca)}
                    className="btn btn-primary btn-full"
                  >
                    <TrendingUp size={20} />
                    Ver Penca
                  </button>
                </div>
              );
            })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
