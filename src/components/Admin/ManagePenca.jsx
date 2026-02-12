import React, { useState, useEffect } from 'react';
import { ref, update, push, set, remove, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { ArrowLeft, Plus, Edit, Trash2, Save, Image, Calendar, Trophy } from 'lucide-react';

const ManagePenca = ({ penca, onBack }) => {
  const [activeTab, setActiveTab] = useState('teams');
  const [teams, setTeams] = useState(penca.teams || {});
  const [matches, setMatches] = useState(penca.matches || {});
  const [divisionals, setDivisionals] = useState(penca.divisionals || {});
  const [matchdays, setMatchdays] = useState(penca.matchdays || {});
  const [selectedDivisional, setSelectedDivisional] = useState(null);
  const [selectedMatchday, setSelectedMatchday] = useState(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showAddDivisional, setShowAddDivisional] = useState(false);
  const [showAddMatchday, setShowAddMatchday] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showPublishResult, setShowPublishResult] = useState(false);
  const [publishingMatch, setPublishingMatch] = useState(null);
  const [resultForm, setResultForm] = useState({ homeScore: '', awayScore: '' });
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [filterMatchday, setFilterMatchday] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterTeamDivisional, setFilterTeamDivisional] = useState('all');

  // Forms
  const [teamForm, setTeamForm] = useState({ name: '', logoUrl: '', divisionalId: '' });
  const [divisionalForm, setDivisionalForm] = useState({ name: '' });
  const [matchdayForm, setMatchdayForm] = useState({ number: '', name: '', divisionalId: '' });
  const [imagePreview, setImagePreview] = useState('');

  // Handle image file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('⚠️ Solo se permiten archivos de imagen');
      return;
    }

    // Validate file size (max 150KB)
    if (file.size > 150000) {
      alert('⚠️ La imagen debe pesar menos de 150KB. Reduce el tamaño o la calidad de la imagen.');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setTeamForm({...teamForm, logoUrl: base64String});
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Match form
  const [matchForm, setMatchForm] = useState({
    homeTeam: '',
    awayTeam: '',
    date: '',
    time: '',
    homeScore: '',
    awayScore: '',
    status: 'scheduled',
    matchdayId: '',
    divisionalId: ''
  });

  const handleAddTeam = async (e) => {
    e.preventDefault();

    try {
      const divId = selectedDivisional || '';
      const newTeamRef = push(ref(database, `pencas/${penca.id}/teams`));
      await set(newTeamRef, {
        name: teamForm.name,
        logo: teamForm.logoUrl || '',
        divisionalId: divId
      });

      setTeams({ 
        ...teams, 
        [newTeamRef.key]: { 
          name: teamForm.name, 
          logo: teamForm.logoUrl,
          divisionalId: divId
        } 
      });
      setTeamForm({ name: '', logoUrl: '', divisionalId: '' });
      setImagePreview('');
      setShowAddTeam(false);
    } catch (error) {
      console.error('Error adding team:', error);
      alert('Error al agregar equipo');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('¿Eliminar este equipo?')) return;

    try {
      await remove(ref(database, `pencas/${penca.id}/teams/${teamId}`));
      const newTeams = { ...teams };
      delete newTeams[teamId];
      setTeams(newTeams);
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleAddMatch = async (e) => {
    e.preventDefault();

    try {
      const matchData = {
        ...matchForm,
        createdAt: Date.now()
      };

      if (editingMatch) {
        await update(ref(database, `pencas/${penca.id}/matches/${editingMatch}`), matchData);
        setMatches({ ...matches, [editingMatch]: matchData });
        setEditingMatch(null);
      } else {
        const newMatchRef = push(ref(database, `pencas/${penca.id}/matches`));
        await set(newMatchRef, matchData);
        setMatches({ ...matches, [newMatchRef.key]: matchData });
      }

      setMatchForm({
        homeTeam: '',
        awayTeam: '',
        date: '',
        time: '',
        homeScore: '',
        awayScore: '',
        status: 'scheduled',
        matchdayId: '',
        divisionalId: ''
      });
      setShowAddMatch(false);
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Error al guardar partido');
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('¿Eliminar este partido?')) return;

    try {
      await remove(ref(database, `pencas/${penca.id}/matches/${matchId}`));
      const newMatches = { ...matches };
      delete newMatches[matchId];
      setMatches(newMatches);
    } catch (error) {
      console.error('Error deleting match:', error);
    }
  };

  const handlePublishResult = async (e) => {
    e.preventDefault();

    if (!publishingMatch) return;

    try {
      const homeScore = parseInt(resultForm.homeScore);
      const awayScore = parseInt(resultForm.awayScore);

      if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
        alert('Por favor ingresa resultados válidos');
        return;
      }

      // Publicar resultado
      await update(ref(database, `pencas/${penca.id}/matches/${publishingMatch}`), {
        homeScore,
        awayScore,
        status: 'finished',
        publishedAt: Date.now()
      });

      // Calcular y otorgar puntos a los participantes
      await calculateAndAwardPoints(publishingMatch, homeScore, awayScore);

      const updatedMatches = { ...matches };
      updatedMatches[publishingMatch] = {
        ...updatedMatches[publishingMatch],
        homeScore,
        awayScore,
        status: 'finished',
        publishedAt: Date.now()
      };
      setMatches(updatedMatches);

      setShowPublishResult(false);
      setPublishingMatch(null);
      setResultForm({ homeScore: '', awayScore: '' });
      alert('Resultado publicado y puntos otorgados exitosamente');
    } catch (error) {
      console.error('Error publishing result:', error);
      alert('Error al publicar resultado');
    }
  };

  const calculateAndAwardPoints = async (matchId, homeScore, awayScore) => {
    try {
      // Obtener todas las predicciones para este partido
      const predictionsRef = ref(database, `predictions/${penca.id}`);
      const predictionsSnapshot = await get(predictionsRef);

      if (!predictionsSnapshot.exists()) return;

      const allPredictions = predictionsSnapshot.val();
      const pointsPerExactScore = penca.pointsPerExactScore || 8;
      const pointsPerDifference = penca.pointsPerDifference || 5;
      const pointsPerWinner = penca.pointsPerWinner || 3;

      const realDifference = homeScore - awayScore;
      const realWinner = homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';

      // Iterar por cada usuario que hizo predicciones
      for (const [userId, userPredictions] of Object.entries(allPredictions)) {
        if (userPredictions[matchId]) {
          const prediction = userPredictions[matchId];
          const predHome = prediction.homeScore;
          const predAway = prediction.awayScore;
          let pointsEarned = 0;

          // Verificar resultado exacto
          if (predHome === homeScore && predAway === awayScore) {
            pointsEarned = pointsPerExactScore;
          }
          // Verificar diferencia de goles correcta
          else if ((predHome - predAway) === realDifference) {
            pointsEarned = pointsPerDifference;
          }
          // Verificar ganador correcto
          else {
            const predWinner = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
            if (predWinner === realWinner) {
              pointsEarned = pointsPerWinner;
            }
          }

          // Si ganó puntos, actualizar en la base de datos
          if (pointsEarned > 0) {
            const participantRef = ref(database, `pencas/${penca.id}/participants/${userId}`);
            const participantSnapshot = await get(participantRef);
            
            if (participantSnapshot.exists()) {
              const currentPoints = participantSnapshot.val().points || 0;
              await update(participantRef, {
                points: currentPoints + pointsEarned
              });
              
              console.log(`Puntos otorgados: ${pointsEarned} a usuario ${userId}. Total: ${currentPoints + pointsEarned}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error calculating points:', error);
    }
  };

  const handleApproveRequest = async (userId) => {
    try {
      const request = penca.pendingRequests[userId];
      
      // Agregar a participantes
      await set(ref(database, `pencas/${penca.id}/participants/${userId}`), {
        displayName: request.displayName,
        username: request.username,
        joinedAt: Date.now(),
        points: 0
      });

      // Eliminar de solicitudes pendientes
      await remove(ref(database, `pencas/${penca.id}/pendingRequests/${userId}`));

      alert(`¡Solicitud de ${request.displayName} aprobada!`);
      window.location.reload();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error al aprobar solicitud');
    }
  };

  const handleRejectRequest = async (userId) => {
    if (!window.confirm('¿Rechazar esta solicitud?')) return;

    try {
      await remove(ref(database, `pencas/${penca.id}/pendingRequests/${userId}`));
      alert('Solicitud rechazada');
      window.location.reload();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error al rechazar solicitud');
    }
  };

  const editMatch = (matchId) => {
    setMatchForm(matches[matchId]);
    setEditingMatch(matchId);
    setShowAddMatch(true);
  };

  const getTeamName = (teamId) => {
    return teams[teamId]?.name || 'Desconocido';
  };

  const getTeamLogo = (teamId) => {
    return teams[teamId]?.logo || null;
  };

  // Divisional handlers
  const handleAddDivisional = async (e) => {
    e.preventDefault();
    try {
      const newDivRef = push(ref(database, `pencas/${penca.id}/divisionals`));
      await set(newDivRef, { name: divisionalForm.name });
      setDivisionals({ ...divisionals, [newDivRef.key]: { name: divisionalForm.name } });
      setDivisionalForm({ name: '' });
      setShowAddDivisional(false);
    } catch (error) {
      console.error('Error adding divisional:', error);
      alert('Error al agregar divisional');
    }
  };

  const handleDeleteDivisional = async (divId) => {
    if (!window.confirm('¿Eliminar esta divisional?')) return;
    try {
      await remove(ref(database, `pencas/${penca.id}/divisionals/${divId}`));
      const newDivs = { ...divisionals };
      delete newDivs[divId];
      setDivisionals(newDivs);
    } catch (error) {
      console.error('Error deleting divisional:', error);
    }
  };

  // Matchday handlers
  const handleAddMatchday = async (e) => {
    e.preventDefault();
    try {
      const divId = selectedDivisional || '';
      const newMdRef = push(ref(database, `pencas/${penca.id}/matchdays`));
      await set(newMdRef, { 
        number: parseInt(matchdayForm.number),
        name: matchdayForm.name || `Fecha ${matchdayForm.number}`,
        divisionalId: divId
      });
      setMatchdays({ 
        ...matchdays, 
        [newMdRef.key]: { 
          number: parseInt(matchdayForm.number),
          name: matchdayForm.name || `Fecha ${matchdayForm.number}`,
          divisionalId: divId
        } 
      });
      setMatchdayForm({ number: '', name: '', divisionalId: '' });
      setShowAddMatchday(false);
    } catch (error) {
      console.error('Error adding matchday:', error);
      alert('Error al agregar fecha');
    }
  };

  const handleDeleteMatchday = async (mdId) => {
    if (!window.confirm('¿Eliminar esta fecha?')) return;
    try {
      await remove(ref(database, `pencas/${penca.id}/matchdays/${mdId}`));
      const newMds = { ...matchdays };
      delete newMds[mdId];
      setMatchdays(newMds);
    } catch (error) {
      console.error('Error deleting matchday:', error);
    }
  };

  // Get unique matchdays and groups
  const getMatchdaysList = () => {
    return Object.entries(matchdays)
      .filter(([id, md]) => md.divisionalId === selectedDivisional)
      .map(([id, md]) => ({ id, ...md }))
      .sort((a, b) => a.number - b.number);
  };

  const getTeamsInDivisional = () => {
    return Object.entries(teams)
      .filter(([id, team]) => team.divisionalId === selectedDivisional)
      .map(([id, team]) => ({ id, ...team }));
  };

  const getDivisionalsList = () => {
    return Object.entries(divisionals)
      .map(([id, div]) => ({ id, ...div }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Filter matches
  const getFilteredMatches = () => {
    return Object.entries(matches).filter(([id, match]) => {
      // Si hay divisional seleccionada, filtrar por ella
      if (selectedDivisional && match.divisionalId !== selectedDivisional) return false;
      if (filterMatchday !== 'all' && match.matchdayId !== filterMatchday) return false;
      if (filterGroup !== 'all' && match.divisionalId !== filterGroup) return false;
      return true;
    });
  };

  // Group matches by matchday and divisional
  const getGroupedMatches = () => {
    const filtered = getFilteredMatches();
    const grouped = {};

    filtered.forEach(([id, match]) => {
      const matchdayData = matchdays[match.matchdayId];
      const divisionalData = divisionals[match.divisionalId];
      
      const matchdayName = matchdayData ? `Fecha ${matchdayData.number}` : 'Sin fecha';
      const divisionalName = divisionalData ? divisionalData.name : 'General';
      const key = `${match.matchdayId || 'none'}|${match.divisionalId || 'none'}`;

      if (!grouped[key]) {
        grouped[key] = {
          matchday: matchdayName,
          matchdayNumber: matchdayData?.number || 999,
          divisional: divisionalName,
          matches: []
        };
      }
      grouped[key].matches.push([id, match]);
    });

    // Sort matches within each group
    Object.values(grouped).forEach(g => {
      g.matches.sort((a, b) => 
        new Date(a[1].date + ' ' + a[1].time) - new Date(b[1].date + ' ' + b[1].time)
      );
    });

    return Object.values(grouped).sort((a, b) => {
      if (a.matchdayNumber !== b.matchdayNumber) return a.matchdayNumber - b.matchdayNumber;
      return a.divisional.localeCompare(b.divisional);
    });
  };

  // Group teams by divisional
  const getGroupedTeams = () => {
    const filtered = Object.entries(teams).filter(([id, team]) => {
      if (filterTeamDivisional !== 'all' && team.divisionalId !== filterTeamDivisional) return false;
      return true;
    });

    const grouped = {};
    filtered.forEach(([id, team]) => {
      const divisionalData = divisionals[team.divisionalId];
      const divisionalName = divisionalData ? divisionalData.name : 'Sin Divisional';
      const key = team.divisionalId || 'none';

      if (!grouped[key]) {
        grouped[key] = {
          divisional: divisionalName,
          teams: []
        };
      }
      grouped[key].teams.push([id, team]);
    });

    return Object.values(grouped).sort((a, b) => 
      a.divisional.localeCompare(b.divisional)
    );
  };

  return (
    <div className="manage-penca">
      <header className="admin-header">
        <div className="container">
          <div className="flex items-center gap-2">
            <button onClick={() => {
              if (selectedMatchday) {
                setSelectedMatchday(null);
              } else if (selectedDivisional) {
                setSelectedDivisional(null);
              } else {
                onBack();
              }
            }} className="btn btn-outline">
              <ArrowLeft size={20} />
              Volver
            </button>
            <div>
              <h1>{penca.name}</h1>
              <p className="text-secondary">
                {selectedMatchday
                  ? `📅 Fecha ${matchdays[selectedMatchday]?.number || ''} ${matchdays[selectedMatchday]?.name ? '- ' + matchdays[selectedMatchday].name : ''}`
                  : selectedDivisional 
                    ? `📂 ${divisionals[selectedDivisional]?.name || 'Divisional'}` 
                    : penca.description}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Vista de solicitudes pendientes */}
        {showPendingRequests ? (
          <div className="tab-content">
            <div className="actions-bar">
              <button onClick={() => setShowPendingRequests(false)} className="btn btn-outline">
                <ArrowLeft size={20} />
                Volver a Divisionales
              </button>
            </div>

            <h2 style={{ marginBottom: '20px' }}>📩 Solicitudes Pendientes</h2>

            {!penca.pendingRequests || Object.keys(penca.pendingRequests).length === 0 ? (
              <div className="empty-state">
                <p className="text-secondary">No hay solicitudes pendientes</p>
              </div>
            ) : (
              <div className="grid grid-2">
                {Object.entries(penca.pendingRequests).map(([userId, request]) => (
                  <div key={userId} className="card" style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                      <h3 style={{ marginBottom: '5px' }}>👤 {request.displayName}</h3>
                      <p className="text-secondary" style={{ fontSize: '0.9rem' }}>@{request.username}</p>
                      <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                        📅 Solicitado: {new Date(request.requestedAt).toLocaleString('es-ES')}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleApproveRequest(userId)}
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                      >
                        ✅ Aprobar
                      </button>
                      <button
                        onClick={() => handleRejectRequest(userId)}
                        className="btn btn-danger"
                        style={{ flex: 1 }}
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
        {/* Vista principal: Grid de divisionales */}
        {!selectedDivisional && (
          <div className="tab-content">
            <div className="actions-bar">
              <button onClick={() => setShowAddDivisional(true)} className="btn btn-primary">
                <Plus size={20} />
                Agregar Divisional
              </button>
              {penca.pendingRequests && Object.keys(penca.pendingRequests).length > 0 && (
                <button 
                  onClick={() => setShowPendingRequests(true)} 
                  className="btn btn-secondary"
                  style={{ marginLeft: 'auto', position: 'relative' }}
                >
                  📩 Solicitudes
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {Object.keys(penca.pendingRequests).length}
                  </span>
                </button>
              )}
            </div>

            {Object.keys(divisionals).length === 0 ? (
              <div className="empty-state">
                <p className="text-secondary">No hay divisionales. Crea divisionales para organizar tu torneo. Ej: Grupo A, Zona Norte, etc.</p>
              </div>
            ) : (
              <div className="grid grid-3">
                {getDivisionalsList().map((div) => (
                  <div 
                    key={div.id} 
                    className="team-card card"
                    onClick={() => setSelectedDivisional(div.id)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <h3>🏆 {div.name}</h3>
                    <p className="text-secondary" style={{ fontSize: '0.9rem', margin: '8px 0' }}>
                      {Object.values(teams).filter(t => t.divisionalId === div.id).length} equipos
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDivisional(div.id);
                      }}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista de divisional seleccionada: Tabs de equipos/fechas/fixture */}
        {selectedDivisional && !selectedMatchday && (
          <>
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'teams' ? 'active' : ''}`}
                onClick={() => setActiveTab('teams')}
              >
                <Trophy size={20} />
                Equipos ({getTeamsInDivisional().length})
              </button>
              <button
                className={`tab ${activeTab === 'matchdays' ? 'active' : ''}`}
                onClick={() => setActiveTab('matchdays')}
              >
                📅 Fechas ({getMatchdaysList().length})
              </button>
              <button
                className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('leaderboard')}
              >
                🏅 Tabla de Posiciones
              </button>
            </div>

            {activeTab === 'teams' && (
              <div className="tab-content">
                <div className="actions-bar">
                  <button onClick={() => setShowAddTeam(true)} className="btn btn-primary">
                    <Plus size={20} />
                    Agregar Equipo
                  </button>
                </div>

                {getTeamsInDivisional().length === 0 ? (
                  <div className="empty-state">
                    <p className="text-secondary">No hay equipos en esta divisional</p>
                  </div>
                ) : (
                  <div className="grid grid-3">
                    {getTeamsInDivisional().map((team) => (
                      <div key={team.id} className="team-card card">
                        {team.logo && (
                          <img src={team.logo} alt={team.name} className="team-logo" />
                        )}
                        <h3>{team.name}</h3>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'matchdays' && (
              <div className="tab-content">
                <div className="actions-bar">
                  <button onClick={() => setShowAddMatchday(true)} className="btn btn-primary">
                    <Plus size={20} />
                    Agregar Fecha
                  </button>
                </div>

                {getMatchdaysList().length === 0 ? (
                  <div className="empty-state">
                    <p className="text-secondary">No hay fechas en esta divisional. Crea las fechas/jornadas.</p>
                  </div>
                ) : (
                  <div className="grid grid-3">
                    {getMatchdaysList().map((md) => {
                      const matchesInMatchday = Object.values(matches).filter(
                        m => m.matchdayId === md.id && m.divisionalId === selectedDivisional
                      ).length;
                      
                      return (
                        <div 
                          key={md.id} 
                          className="team-card card" 
                          onClick={() => setSelectedMatchday(md.id)}
                          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <h3>📅 Fecha {md.number}</h3>
                          {md.name && <p className="text-secondary">{md.name}</p>}
                          <p className="text-secondary" style={{ marginTop: '8px', fontSize: '14px' }}>
                            {matchesInMatchday} {matchesInMatchday === 1 ? 'partido' : 'partidos'}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMatchday(md.id);
                            }}
                            className="btn btn-danger btn-sm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="tab-content">
                {!penca.participants || Object.keys(penca.participants).length === 0 ? (
                  <div className="empty-state">
                    <p className="text-secondary">No hay usuarios unidos a esta penca aún.</p>
                  </div>
                ) : (
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ marginBottom: '20px' }}>🏆 Tabla de Posiciones General</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #444' }}>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Pos</th>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Jugador</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Puntos</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Fecha de Ingreso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(penca.participants)
                          .sort(([, a], [, b]) => (b.points || 0) - (a.points || 0))
                          .map(([uid, participant], index) => (
                            <tr key={uid} style={{ borderBottom: '1px solid #333' }}>
                              <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div>
                                  <div style={{ fontWeight: '500' }}>{participant.displayName || 'Usuario'}</div>
                                  <div style={{ fontSize: '0.85rem', color: '#888' }}>@{participant.username}</div>
                                </div>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#4ade80' }}>
                                {participant.points || 0}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
                                {new Date(participant.joinedAt).toLocaleDateString('es-ES')}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        </>
        )}

        {/* Vista: Partidos de una fecha específica */}
        {selectedDivisional && selectedMatchday && (
          <div className="tab-content">
            <div className="actions-bar">
              <button onClick={() => {
                setShowAddMatch(true);
                setEditingMatch(null);
                setMatchForm({
                  homeTeam: '',
                  awayTeam: '',
                  date: '',
                  time: '',
                  homeScore: '',
                  awayScore: '',
                  status: 'scheduled',
                  matchdayId: selectedMatchday,
                  divisionalId: selectedDivisional
                });
              }} className="btn btn-primary">
                <Plus size={20} />
                Agregar Partido
              </button>
            </div>

            {Object.values(matches).filter(m => m.matchdayId === selectedMatchday && m.divisionalId === selectedDivisional).length === 0 ? (
              <div className="empty-state">
                <p className="text-secondary">No hay partidos en esta fecha. Crea los enfrentamientos.</p>
              </div>
            ) : (
              <div className="matches-list">
                {Object.entries(matches)
                  .filter(([_, m]) => m.matchdayId === selectedMatchday && m.divisionalId === selectedDivisional)
                  .map(([matchId, match]) => (
                    <div key={matchId} className="match-card card">
                      <div className="match-header">
                        <span className="badge badge-info">
                          {match.status === 'scheduled' && '⏳ Programado'}
                          {match.status === 'live' && '🔴 En vivo'}
                          {match.status === 'finished' && '✅ Finalizado'}
                        </span>
                        <span className="text-secondary">{match.date} {match.time}</span>
                      </div>
                      <div className="match-teams">
                        <div className="team">
                          {teams[match.homeTeam]?.logoUrl && (
                            <img src={teams[match.homeTeam].logoUrl} alt="" className="team-logo" />
                          )}
                          <span>{teams[match.homeTeam]?.name || 'Desconocido'}</span>
                          {match.status !== 'scheduled' && (
                            <span className="score">{match.homeScore ?? '-'}</span>
                          )}
                        </div>
                        <div className="vs">VS</div>
                        <div className="team">
                          {match.status !== 'scheduled' && (
                            <span className="score">{match.awayScore ?? '-'}</span>
                          )}
                          <span>{teams[match.awayTeam]?.name || 'Desconocido'}</span>
                          {teams[match.awayTeam]?.logoUrl && (
                            <img src={teams[match.awayTeam].logoUrl} alt="" className="team-logo" />
                          )}
                        </div>
                      </div>
                      <div className="match-actions">
                        {match.status === 'scheduled' && (
                          <button
                            onClick={() => {
                              setPublishingMatch(matchId);
                              setResultForm({ homeScore: '', awayScore: '' });
                              setShowPublishResult(true);
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            <Save size={16} /> Publicar Resultado
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingMatch(matchId);
                            setMatchForm({ ...match, divisionalId: selectedDivisional, matchdayId: selectedMatchday });
                            setShowAddMatch(true);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          <Edit size={16} /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteMatch(matchId)}
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Add Team */}
      {showAddTeam && (
        <div className="modal-overlay" onClick={() => setShowAddTeam(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Agregar Equipo</h2>
            <form onSubmit={handleAddTeam} className="modal-form">
              <div className="form-group">
                <label>Nombre del Equipo *</label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={e => setTeamForm({...teamForm, name: e.target.value})}
                  required
                  placeholder="Ej: Argentina, Brasil, Uruguay"
                />
              </div>

              <div className="form-group">
                <label>Logo del Equipo 🖼️</label>
                
                {/* Image preview */}
                {(imagePreview || teamForm.logoUrl) && (
                  <div style={{
                    padding: '10px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    textAlign: 'center'
                  }}>
                    <img 
                      src={imagePreview || teamForm.logoUrl} 
                      alt="Preview" 
                      style={{
                        maxWidth: '100px',
                        maxHeight: '100px',
                        objectFit: 'contain'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setTeamForm({...teamForm, logoUrl: ''});
                        setImagePreview('');
                      }}
                      style={{
                        display: 'block',
                        margin: '8px auto 0',
                        padding: '4px 12px',
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Quitar imagen
                    </button>
                  </div>
                )}

                {/* File upload */}
                <div style={{ marginBottom: '10px' }}>
                  <label 
                    htmlFor="file-upload" 
                    className="btn btn-secondary"
                    style={{
                      display: 'inline-block',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <Image size={16} style={{ marginRight: '8px' }} />
                    Subir desde tu PC
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <small className="text-secondary" style={{ display: 'block', marginTop: '5px' }}>
                    💾 Máximo 150KB
                  </small>
                </div>

                {/* URL input */}
                <div style={{ marginTop: '10px' }}>
                  <small className="text-secondary" style={{ display: 'block', marginBottom: '5px' }}>
                    O pega una URL:
                  </small>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/logo.png"
                    value={teamForm.logoUrl && !teamForm.logoUrl.startsWith('data:') ? teamForm.logoUrl : ''}
                    onChange={e => {
                      setTeamForm({...teamForm, logoUrl: e.target.value});
                      setImagePreview('');
                    }}
                  />
                  <small className="text-secondary" style={{ display: 'block', marginTop: '5px' }}>
                    💡 Busca en Google Images, click derecho → "Copiar dirección de imagen"
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddTeam(false)} className="btn btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Match */}
      {showAddMatch && (
        <div className="modal-overlay" onClick={() => {
          setShowAddMatch(false);
          setEditingMatch(null);
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingMatch ? 'Editar Partido' : 'Agregar Partido'}</h2>
            <form onSubmit={handleAddMatch} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Equipo Local *</label>
                  <select
                    value={matchForm.homeTeam}
                    onChange={e => setMatchForm({...matchForm, homeTeam: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {getTeamsInDivisional().map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Equipo Visitante *</label>
                  <select
                    value={matchForm.awayTeam}
                    onChange={e => setMatchForm({...matchForm, awayTeam: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {getTeamsInDivisional().map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha *</label>
                  {selectedMatchday ? (
                    <input
                      type="text"
                      value={`Fecha ${matchdays[selectedMatchday]?.number} ${matchdays[selectedMatchday]?.name || ''}`}
                      disabled
                      style={{ backgroundColor: '#1a1a2e', cursor: 'not-allowed' }}
                    />
                  ) : (
                    <select
                      value={matchForm.matchdayId}
                      onChange={e => setMatchForm({...matchForm, matchdayId: e.target.value})}
                      required
                    >
                      <option value="">Seleccionar fecha...</option>
                      {getMatchdaysList().map(md => (
                        <option key={md.id} value={md.id}>Fecha {md.number}</option>
                      ))}
                    </select>
                  )}
                  <small className="text-secondary">💡 {selectedMatchday ? 'Fecha asignada automáticamente' : 'Crea fechas en la pestaña "Fechas"'}</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    value={matchForm.date}
                    onChange={e => setMatchForm({...matchForm, date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Hora *</label>
                  <input
                    type="time"
                    value={matchForm.time}
                    onChange={e => setMatchForm({...matchForm, time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Estado del Partido</label>
                <select
                  value={matchForm.status}
                  onChange={e => setMatchForm({...matchForm, status: e.target.value})}
                >
                  <option value="scheduled">Programado</option>
                  <option value="live">En vivo</option>
                  <option value="finished">Finalizado</option>
                </select>
              </div>

              {matchForm.status === 'finished' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Goles Local</label>
                    <input
                      type="number"
                      min="0"
                      value={matchForm.homeScore}
                      onChange={e => setMatchForm({...matchForm, homeScore: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Goles Visitante</label>
                    <input
                      type="number"
                      min="0"
                      value={matchForm.awayScore}
                      onChange={e => setMatchForm({...matchForm, awayScore: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" onClick={() => {
                  setShowAddMatch(false);
                  setEditingMatch(null);
                }} className="btn btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMatch ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Divisional */}
      {showAddDivisional && (
        <div className="modal-overlay" onClick={() => setShowAddDivisional(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>🏆 Agregar Divisional</h2>
            <form onSubmit={handleAddDivisional} className="modal-form">
              <div className="form-group">
                <label>Nombre de la Divisional *</label>
                <input
                  type="text"
                  value={divisionalForm.name}
                  onChange={e => setDivisionalForm({...divisionalForm, name: e.target.value})}
                  required
                  placeholder="Ej: Grupo A, Zona Norte, División Sur"
                />
                <small className="text-secondary">
                  💡 Divide tu torneo en grupos o zonas
                </small>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddDivisional(false)} className="btn btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar Divisional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Matchday */}
      {showAddMatchday && (
        <div className="modal-overlay" onClick={() => setShowAddMatchday(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>📅 Agregar Fecha</h2>
            <form onSubmit={handleAddMatchday} className="modal-form">
              <div className="form-group">
                <label>Número de Fecha *</label>
                <input
                  type="number"
                  min="1"
                  value={matchdayForm.number}
                  onChange={e => setMatchdayForm({...matchdayForm, number: e.target.value})}
                  required
                  placeholder="1"
                />
                <small className="text-secondary">
                  Número de la jornada (1, 2, 3...)
                </small>
              </div>

              <div className="form-group">
                <label>Nombre (Opcional)</label>
                <input
                  type="text"
                  value={matchdayForm.name}
                  onChange={e => setMatchdayForm({...matchdayForm, name: e.target.value})}
                  placeholder="Ej: Jornada Inaugural, Fecha Clásica"
                />
                <small className="text-secondary">
                  Nombre descriptivo opcional
                </small>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddMatchday(false)} className="btn btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar Fecha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Publicar Resultado */}
      {showPublishResult && publishingMatch && matches[publishingMatch] && (
        <div className="modal-overlay" onClick={() => setShowPublishResult(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>⚽ Publicar Resultado</h2>
            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                    {teams[matches[publishingMatch].homeTeam]?.name || 'Equipo Local'}
                  </div>
                </div>
                <div style={{ padding: '0 20px', color: '#888' }}>VS</div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                    {teams[matches[publishingMatch].awayTeam]?.name || 'Equipo Visitante'}
                  </div>
                </div>
              </div>
            </div>
            
            <form onSubmit={handlePublishResult} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Goles Local *</label>
                  <input
                    type="number"
                    min="0"
                    value={resultForm.homeScore}
                    onChange={e => setResultForm({...resultForm, homeScore: e.target.value})}
                    required
                    placeholder="0"
                    style={{ textAlign: 'center', fontSize: '1.5rem' }}
                  />
                </div>

                <div className="form-group">
                  <label>Goles Visitante *</label>
                  <input
                    type="number"
                    min="0"
                    value={resultForm.awayScore}
                    onChange={e => setResultForm({...resultForm, awayScore: e.target.value})}
                    required
                    placeholder="0"
                    style={{ textAlign: 'center', fontSize: '1.5rem' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowPublishResult(false)} className="btn btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  ✅ Publicar Resultado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePenca;
