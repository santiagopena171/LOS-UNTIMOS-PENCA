import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, push, set } from 'firebase/database';
import { database } from '../../config/firebase';
import { X, Trophy } from 'lucide-react';

const CreatePenca = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsPerExactScore: 8,
    pointsPerDifference: 5,
    pointsPerWinner: 3,
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const pencasRef = ref(database, 'pencas');
      const newPencaRef = push(pencasRef);
      
      await set(newPencaRef, {
        ...formData,
        adminId: currentUser.uid,
        createdAt: Date.now(),
        participants: {},
        matches: {},
        teams: {}
      });

      onClose();
    } catch (error) {
      console.error('Error creating penca:', error);
      setError('Error al crear la penca. Intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2><Trophy size={24} /> Crear Nueva Penca</h2>
            <p className="text-secondary">Completa la información básica</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={24} />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nombre de la Penca *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: Copa América 2026"
              required
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Describe esta penca..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Puntos por resultado exacto</label>
              <input
                type="number"
                value={formData.pointsPerExactScore}
                onChange={e => setFormData({...formData, pointsPerExactScore: parseInt(e.target.value)})}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Puntos por acertar diferencia</label>
              <input
                type="number"
                value={formData.pointsPerDifference}
                onChange={e => setFormData({...formData, pointsPerDifference: parseInt(e.target.value)})}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Puntos por acertar ganador</label>
            <input
              type="number"
              value={formData.pointsPerWinner}
              onChange={e => setFormData({...formData, pointsPerWinner: parseInt(e.target.value)})}
              min="1"
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Penca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePenca;
