import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, push, get, set, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { Plus, Trophy, LogOut, Users, Calendar, Edit, Trash2, Link as LinkIcon, Copy } from 'lucide-react';
import CreatePenca from './CreatePenca';
import ManagePenca from './ManagePenca';
import './Admin.css';

const AdminDashboard = () => {
  const { logout, currentUser } = useAuth();
  const [pencas, setPencas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPenca, setSelectedPenca] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadPencas();
  }, [currentUser]);

  const loadPencas = async () => {
    try {
      const pencasRef = ref(database, 'pencas');
      const snapshot = await get(pencasRef);
      
      if (snapshot.exists()) {
        const allPencas = snapshot.val();
        // Filtrar solo las pencas del admin actual
        const myPencas = Object.keys(allPencas)
          .filter(key => allPencas[key].adminId === currentUser.uid)
          .map(key => ({
            id: key,
            ...allPencas[key]
          }));
        setPencas(myPencas);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading pencas:', error);
      setLoading(false);
    }
  };

  const handleDeletePenca = async (pencaId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta penca? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await remove(ref(database, `pencas/${pencaId}`));
      setPencas(pencas.filter(p => p.id !== pencaId));
    } catch (error) {
      console.error('Error deleting penca:', error);
      alert('Error al eliminar la penca');
    }
  };

  const copyInviteLink = (pencaId) => {
    const link = `${window.location.origin}?invite=${pencaId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(pencaId);
    setTimeout(() => setCopiedId(null), 2000);
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
      <ManagePenca 
        penca={selectedPenca} 
        onBack={() => {
          setSelectedPenca(null);
          loadPencas();
        }} 
      />
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="container">
          <div className="flex justify-between items-center">
            <div>
              <h1>⚽ Panel de Administrador</h1>
              <p className="text-secondary">Gestiona tus pencas</p>
            </div>
            <button onClick={handleLogout} className="btn btn-outline">
              <LogOut size={20} />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="actions-bar">
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="btn btn-primary"
          >
            <Plus size={20} />
            Crear Nueva Penca
          </button>
        </div>

        {loading ? (
          <div className="spinner"></div>
        ) : pencas.length === 0 ? (
          <div className="empty-state">
            <Trophy size={64} className="text-secondary" />
            <h2>No tienes pencas creadas</h2>
            <p className="text-secondary">Crea tu primera penca para comenzar</p>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="btn btn-primary mt-3"
            >
              <Plus size={20} />
              Crear Penca
            </button>
          </div>
        ) : (
          <div className="grid grid-2">
            {pencas.map(penca => (
              <div key={penca.id} className="penca-card card">
                <div className="penca-card-header">
                  <h3>{penca.name}</h3>
                  <span className="badge">
                    {penca.status === 'active' ? '✅ Activa' : '⏸️ Inactiva'}
                  </span>
                </div>
                
                <p className="penca-description">{penca.description}</p>
                
                <div className="penca-stats">
                  <div className="stat">
                    <Users size={18} />
                    <span>{Object.keys(penca.participants || {}).length} participantes</span>
                  </div>
                  <div className="stat">
                    <Calendar size={18} />
                    <span>{Object.keys(penca.matches || {}).length} partidos</span>
                  </div>
                  {penca.pendingRequests && Object.keys(penca.pendingRequests).length > 0 && (
                    <div className="stat" style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                      <span>📩 {Object.keys(penca.pendingRequests).length} solicitud{Object.keys(penca.pendingRequests).length !== 1 ? 'es' : ''} pendiente{Object.keys(penca.pendingRequests).length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                <div className="penca-actions">
                  <button 
                    onClick={() => setSelectedPenca(penca)}
                    className="btn btn-primary btn-sm"
                  >
                    <Edit size={18} />
                    Gestionar
                  </button>
                  
                  <button 
                    onClick={() => copyInviteLink(penca.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    {copiedId === penca.id ? (
                      <>✓ Copiado</>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copiar Link
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => handleDeletePenca(penca.id)}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreatePenca 
          onClose={() => {
            setShowCreateModal(false);
            loadPencas();
          }} 
        />
      )}
    </div>
  );
};

export default AdminDashboard;
