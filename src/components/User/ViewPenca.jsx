import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, get, set } from 'firebase/database';
import { database } from '../../config/firebase';
import { ArrowLeft, Trophy, Calendar, TrendingUp, Edit2, Check } from 'lucide-react';
import { cache, getCacheKey } from '../../utils/cache';
import LazyImage from '../LazyImage';

const ViewPenca = ({ penca, onBack }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState({});
  const [matchdays, setMatchdays] = useState({});
  const [divisionals, setDivisionals] = useState({});
  const [predictions, setPredictions] = useState({});
  const [standings, setStandings] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);
  const [predictionForm, setPredictionForm] = useState({ homeScore: '', awayScore: '' });
  const [filterMatchday, setFilterMatchday] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [viewingUserPredictions, setViewingUserPredictions] = useState(null);
  const [userPredictionsData, setUserPredictionsData] = useState({});
  const [viewingMatchPredictions, setViewingMatchPredictions] = useState(null);
  const [matchPredictionsData, setMatchPredictionsData] = useState([]);

  useEffect(() => {
    loadData();
  }, [penca]);

  const loadData = async () => {
    try {
      // Load matches (datos que cambian, no cachear)
      if (penca.matches) {
        const matchesArray = Object.entries(penca.matches).map(([id, match]) => ({
          id,
          ...match
        })).sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
        setMatches(matchesArray);
      }

      // Load teams (datos estáticos, cachear)
      if (penca.teams) {
        setTeams(penca.teams);
        cache.set(getCacheKey('teams', penca.id), penca.teams);
      }

      // Load matchdays (datos estáticos, cachear)
      if (penca.matchdays) {
        setMatchdays(penca.matchdays);
        cache.set(getCacheKey('matchdays', penca.id), penca.matchdays);
      }

      // Load divisionals (datos estáticos, cachear)
      if (penca.divisionals) {
        setDivisionals(penca.divisionals);
        cache.set(getCacheKey('divisionals', penca.id), penca.divisionals);
      }

      // Load user predictions con caché
      const cacheKey = getCacheKey('predictions', `${penca.id}_${currentUser.uid}`);
      const cachedPredictions = cache.get(cacheKey);
      
      if (cachedPredictions) {
        console.log('📦 Using cached predictions');
        setPredictions(cachedPredictions);
      } else {
        console.log('📥 Downloading predictions from Firebase');
        const predictionsRef = ref(database, `predictions/${penca.id}/${currentUser.uid}`);
        const predictionsSnapshot = await get(predictionsRef);
        if (predictionsSnapshot.exists()) {
          const data = predictionsSnapshot.val();
          setPredictions(data);
          cache.set(cacheKey, data);
        }
      }

      // Calculate standings
      calculateStandings();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const calculatePointsEarned = (match, prediction) => {
    if (match.status !== 'finished' || !prediction) return null;

    const pointsPerExactScore = penca.pointsPerExactScore || 8;
    const pointsPerDifference = penca.pointsPerDifference || 5;
    const pointsPerWinner = penca.pointsPerWinner || 3;

    const homeScore = parseInt(match.homeScore);
    const awayScore = parseInt(match.awayScore);
    const predHome = prediction.homeScore;
    const predAway = prediction.awayScore;

    // Verificar resultado exacto
    if (predHome === homeScore && predAway === awayScore) {
      return { points: pointsPerExactScore, type: 'exact' };
    }

    const realDifference = homeScore - awayScore;
    const predDifference = predHome - predAway;

    // Verificar diferencia de goles correcta
    if (predDifference === realDifference) {
      return { points: pointsPerDifference, type: 'difference' };
    }

    // Verificar ganador correcto
    const realWinner = homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';
    const predWinner = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';

    if (predWinner === realWinner) {
      return { points: pointsPerWinner, type: 'winner' };
    }

    return { points: 0, type: 'none' };
  };

  const loadUserPredictions = async (userId) => {
    try {
      const userPredictionsRef = ref(database, `predictions/${penca.id}/${userId}`);
      const snapshot = await get(userPredictionsRef);
      
      if (snapshot.exists()) {
        setUserPredictionsData(snapshot.val());
      } else {
        setUserPredictionsData({});
      }
    } catch (error) {
      console.error('Error loading user predictions:', error);
    }
  };

  const handleViewUserPredictions = async (userId, userName) => {
    await loadUserPredictions(userId);
    setViewingUserPredictions({ userId, userName });
  };

  const loadMatchPredictions = async (matchId) => {
    try {
      const allPredictions = [];
      
      if (penca.participants) {
        for (const [userId, userData] of Object.entries(penca.participants)) {
          const predictionRef = ref(database, `predictions/${penca.id}/${userId}/${matchId}`);
          const snapshot = await get(predictionRef);
          
          if (snapshot.exists()) {
            allPredictions.push({
              userId,
              displayName: userData.displayName,
              username: userData.username,
              prediction: snapshot.val()
            });
          } else {
            allPredictions.push({
              userId,
              displayName: userData.displayName,
              username: userData.username,
              prediction: null
            });
          }
        }
      }
      
      setMatchPredictionsData(allPredictions);
    } catch (error) {
      console.error('Error loading match predictions:', error);
    }
  };

  const handleViewMatchPredictions = async (match) => {
    await loadMatchPredictions(match.id);
    setViewingMatchPredictions(match);
  };

  const calculateStandings = () => {
    if (!penca.participants) return;

    const standingsArray = Object.entries(penca.participants).map(([userId, userData]) => ({
      userId,
      displayName: userData.displayName,
      points: userData.points || 0,
      username: userData.username
    })).sort((a, b) => b.points - a.points);

    setStandings(standingsArray);
  };

  const canPredict = (match) => {
    if (match.status !== 'scheduled') return false;
    
    const matchDate = new Date(match.date + ' ' + match.time);
    const now = new Date();
    const minutesUntilMatch = (matchDate - now) / 1000 / 60;
    
    return minutesUntilMatch > 30;
  };

  const getTimeUntilMatch = (match) => {
    const matchDate = new Date(match.date + ' ' + match.time);
    const now = new Date();
    const minutesUntilMatch = Math.floor((matchDate - now) / 1000 / 60);
    
    if (minutesUntilMatch < 0) return 'Ya comenzó';
    if (minutesUntilMatch < 60) return `${minutesUntilMatch} min`;
    
    const hours = Math.floor(minutesUntilMatch / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const handlePredict = (match) => {
    const existingPrediction = predictions[match.id];
    setPredictionForm({
      homeScore: existingPrediction?.homeScore || '',
      awayScore: existingPrediction?.awayScore || ''
    });
    setEditingMatch(match);
  };

  const savePrediction = async () => {
    if (!editingMatch) return;

    try {
      await set(ref(database, `predictions/${penca.id}/${currentUser.uid}/${editingMatch.id}`), {
        homeScore: parseInt(predictionForm.homeScore),
        awayScore: parseInt(predictionForm.awayScore),
        predictedAt: Date.now()
      });

      const updatedPredictions = {
        ...predictions,
        [editingMatch.id]: {
          homeScore: parseInt(predictionForm.homeScore),
          awayScore: parseInt(predictionForm.awayScore)
        }
      };
      
      setPredictions(updatedPredictions);
      
      // Actualizar caché con nueva predicción
      const cacheKey = getCacheKey('predictions', `${penca.id}_${currentUser.uid}`);
      cache.set(cacheKey, updatedPredictions);

      setEditingMatch(null);
      setPredictionForm({ homeScore: '', awayScore: '' });
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Error al guardar predicción');
    }
  };

  const getTeamName = (teamId) => teams[teamId]?.name || 'Desconocido';
  const getTeamLogo = (teamId) => teams[teamId]?.logo || null;

  // Get unique matchdays and groups
  const getMatchdaysList = () => {
    return Object.entries(matchdays)
      .map(([id, md]) => ({ id, ...md }))
      .sort((a, b) => a.number - b.number);
  };

  const getDivisionalsList = () => {
    return Object.entries(divisionals)
      .map(([id, div]) => ({ id, ...div }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Filter and group matches
  const getGroupedMatches = () => {
    // Filter
    let filtered = matches.filter(match => {
      if (filterMatchday !== 'all' && match.matchdayId !== filterMatchday) return false;
      if (filterGroup !== 'all' && match.divisionalId !== filterGroup) return false;
      return true;
    });

    // Group
    const grouped = {};
    filtered.forEach(match => {
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
      grouped[key].matches.push(match);
    });

    return Object.values(grouped).sort((a, b) => {
      if (a.matchdayNumber !== b.matchdayNumber) return a.matchdayNumber - b.matchdayNumber;
      return a.divisional.localeCompare(b.divisional);
    });
  };

  return (
    <div className="view-penca">
      <header className="user-header">
        <div className="container">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="btn btn-outline">
              <ArrowLeft size={20} />
              Volver
            </button>
            <div>
              <h1>{penca.name}</h1>
              <p className="text-secondary">{penca.description}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            <Calendar size={20} />
            Partidos ({matches.length})
          </button>
          <button
            className={`tab ${activeTab === 'standings' ? 'active' : ''}`}
            onClick={() => setActiveTab('standings')}
          >
            <Trophy size={20} />
            Tabla de Posiciones
          </button>
        </div>

        {activeTab === 'matches' && (
          <div className="tab-content">
            {viewingMatchPredictions ? (
              <div>
                <button 
                  onClick={() => setViewingMatchPredictions(null)}
                  className="btn btn-outline"
                  style={{ marginBottom: '20px' }}
                >
                  <ArrowLeft size={20} />
                  Volver a los partidos
                </button>

                <div className="match-detail-header" style={{ marginBottom: '30px' }}>
                  <h2>📊 Predicciones del partido</h2>
                  
                  <div className="card" style={{ padding: '20px', marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        {getTeamLogo(viewingMatchPredictions.homeTeam) && (
                          <LazyImage src={getTeamLogo(viewingMatchPredictions.homeTeam)} alt="" style={{ width: '60px', height: '60px', marginBottom: '10px' }} />
                        )}
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{getTeamName(viewingMatchPredictions.homeTeam)}</div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                          {viewingMatchPredictions.homeScore} - {viewingMatchPredictions.awayScore}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '5px' }}>
                          📅 {new Date(viewingMatchPredictions.date).toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </div>
                      </div>

                      <div style={{ flex: 1, textAlign: 'center' }}>
                        {getTeamLogo(viewingMatchPredictions.awayTeam) && (
                          <LazyImage src={getTeamLogo(viewingMatchPredictions.awayTeam)} alt="" style={{ width: '60px', height: '60px', marginBottom: '10px' }} />
                        )}
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{getTeamName(viewingMatchPredictions.awayTeam)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 style={{ marginBottom: '15px', fontSize: '1.2rem' }}>
                  👥 Predicciones de todos los participantes ({matchPredictionsData.length})
                </h3>

                {matchPredictionsData.length === 0 ? (
                  <div className="empty-state">
                    <p className="text-secondary">No hay participantes en esta penca</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {matchPredictionsData
                      .sort((a, b) => {
                        if (!a.prediction && !b.prediction) return 0;
                        if (!a.prediction) return 1;
                        if (!b.prediction) return -1;
                        
                        const pointsA = calculatePointsEarned(viewingMatchPredictions, a.prediction);
                        const pointsB = calculatePointsEarned(viewingMatchPredictions, b.prediction);
                        return pointsB.points - pointsA.points;
                      })
                      .map(participant => {
                        const result = participant.prediction ? 
                          calculatePointsEarned(viewingMatchPredictions, participant.prediction) : null;

                        return (
                          <div key={participant.userId} className="card" style={{ 
                            padding: '15px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '15px',
                            background: participant.userId === currentUser.uid ? 'rgba(102, 126, 234, 0.1)' : undefined,
                            border: participant.userId === currentUser.uid ? '2px solid rgba(102, 126, 234, 0.3)' : undefined
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', fontSize: '1rem', marginBottom: '3px' }}>
                                {participant.displayName}
                                {participant.userId === currentUser.uid && (
                                  <span style={{
                                    marginLeft: '8px',
                                    background: 'rgba(102, 126, 234, 0.3)',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                  }}>TÚ</span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#888' }}>@{participant.username}</div>
                            </div>

                            <div style={{ textAlign: 'center', minWidth: '100px' }}>
                              {participant.prediction ? (
                                <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                                  {participant.prediction.homeScore} - {participant.prediction.awayScore}
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.9rem', color: '#ef4444' }}>Sin predicción</div>
                              )}
                            </div>

                            <div style={{ textAlign: 'right', minWidth: '120px' }}>
                              {result ? (
                                <span style={{
                                  fontWeight: 'bold',
                                  fontSize: '1rem',
                                  color: result.type === 'exact' ? '#4ade80' : 
                                         result.type === 'difference' ? '#60a5fa' :
                                         result.type === 'winner' ? '#a78bfa' : '#ef4444'
                                }}>
                                  {result.type === 'exact' && '✅ +' + result.points}
                                  {result.type === 'difference' && '🎯 +' + result.points}
                                  {result.type === 'winner' && '🏆 +' + result.points}
                                  {result.type === 'none' && '❌ 0'} pts
                                </span>
                              ) : (
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>-</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            ) : (
              <>
            {/* Filters */}
            {(getMatchdaysList().length > 0 || getDivisionalsList().length > 0) && (
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '20px',
                flexWrap: 'wrap'
              }}>
                {getMatchdaysList().length > 0 && (
                  <select 
                    value={filterMatchday} 
                    onChange={e => setFilterMatchday(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #444',
                      background: '#2a2a3e',
                      color: 'white',
                      flex: '1',
                      minWidth: '150px'
                    }}
                  >
                    <option value="all">Todas las fechas</option>
                    {getMatchdaysList().map(md => (
                      <option key={md.id} value={md.id}>Fecha {md.number}</option>
                    ))}
                  </select>
                )}

                {getDivisionalsList().length > 0 && (
                  <select 
                    value={filterGroup} 
                    onChange={e => setFilterGroup(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #444',
                      background: '#2a2a3e',
                      color: 'white',
                      flex: '1',
                      minWidth: '150px'
                    }}
                  >
                    <option value="all">Todas las divisionales</option>
                    {getDivisionalsList().map(div => (
                      <option key={div.id} value={div.id}>{div.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {matches.length === 0 ? (
              <div className="empty-state">
                <p className="text-secondary">No hay partidos programados</p>
              </div>
            ) : (
              <div className="matches-list-user">
                {getGroupedMatches().map((group, idx) => (
                  <div key={idx} style={{ marginBottom: '30px' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                        📅 {group.matchday}
                      </h3>
                      {group.divisional !== 'General' && (
                        <span style={{
                          background: 'rgba(255,255,255,0.2)',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.9rem'
                        }}>
                          {group.divisional}
                        </span>
                      )}
                    </div>

                {group.matches.map(match => {
                  const userPrediction = predictions[match.id];
                  const canMakePredict = canPredict(match);

                  return (
                    <div key={match.id} className="match-card-user card">
                      <div className="match-header">
                        <span className={`status status-${match.status}`}>
                          {match.status === 'scheduled' ? '📅 Programado' :
                           match.status === 'live' ? '🔴 EN VIVO' : '✅ Finalizado'}
                        </span>
                        {match.status === 'scheduled' && (
                          <span className="time-until">
                            ⏰ {getTimeUntilMatch(match)}
                          </span>
                        )}
                      </div>

                      <div className="match-teams-user">
                        <div className="team-user">
                          {getTeamLogo(match.homeTeam) && (
                            <LazyImage src={getTeamLogo(match.homeTeam)} alt="" className="team-logo-user" />
                          )}
                          <div className="team-info">
                            <span className="team-name">{getTeamName(match.homeTeam)}</span>
                            {match.status === 'finished' && (
                              <span className="team-score">{match.homeScore}</span>
                            )}
                          </div>
                        </div>

                        <div className="vs-divider">VS</div>

                        <div className="team-user">
                          <div className="team-info team-info-right">
                            <span className="team-name">{getTeamName(match.awayTeam)}</span>
                            {match.status === 'finished' && (
                              <span className="team-score">{match.awayScore}</span>
                            )}
                          </div>
                          {getTeamLogo(match.awayTeam) && (
                            <LazyImage src={getTeamLogo(match.awayTeam)} alt="" className="team-logo-user" />
                          )}
                        </div>
                      </div>

                      <div className="match-datetime">
                        📅 {new Date(match.date).toLocaleDateString('es-ES', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })} • 🕐 {match.time}
                      </div>

                      {userPrediction && (
                        <div className="prediction-display">
                          <strong>Tu predicción:</strong> {userPrediction.homeScore} - {userPrediction.awayScore}
                          {match.status === 'finished' && (() => {
                            const result = calculatePointsEarned(match, userPrediction);
                            if (!result) return null;
                            
                            return (
                              <span style={{ marginLeft: '10px' }}>
                                {result.type === 'exact' && (
                                  <span className="text-success" style={{ fontWeight: 'bold' }}>
                                    ✅ ¡Exacto! +{result.points} pts
                                  </span>
                                )}
                                {result.type === 'difference' && (
                                  <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                                    🎯 Diferencia correcta +{result.points} pts
                                  </span>
                                )}
                                {result.type === 'winner' && (
                                  <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                                    🏆 Ganador correcto +{result.points} pts
                                  </span>
                                )}
                                {result.type === 'none' && (
                                  <span className="text-error">
                                    ❌ 0 pts
                                  </span>
                                )}
                              </span>
                            );
                          })()}
                        </div>
                      )}

                      {match.status === 'finished' ? (
                        <button 
                          onClick={() => handleViewMatchPredictions(match)}
                          className="btn btn-outline btn-full"
                          style={{ marginTop: '10px' }}
                        >
                          <Trophy size={18} />
                          Ver todas las predicciones
                        </button>
                      ) : canMakePredict ? (
                        <button 
                          onClick={() => handlePredict(match)}
                          className="btn btn-primary btn-full"
                        >
                          <Edit2 size={18} />
                          {userPrediction ? 'Editar Predicción' : 'Hacer Predicción'}
                        </button>
                      ) : match.status === 'scheduled' && (
                        <div className="prediction-closed">
                          ⏰ Predicciones cerradas (menos de 30 min)
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              ))}
              </div>
            )}
            </>
            )}
          </div>
        )}

        {activeTab === 'standings' && (
          <div className="tab-content">
            {viewingUserPredictions ? (
              <div>
                <button 
                  onClick={() => setViewingUserPredictions(null)}
                  className="btn btn-outline"
                  style={{ marginBottom: '20px' }}
                >
                  <ArrowLeft size={20} />
                  Volver a la tabla
                </button>

                <h2 style={{ marginBottom: '20px' }}>
                  📊 Predicciones de {viewingUserPredictions.userName}
                </h2>

                {matches.filter(m => m.status === 'finished').length === 0 ? (
                  <div className="empty-state">
                    <p className="text-secondary">No hay partidos finalizados aún</p>
                  </div>
                ) : (
                  <div className="predictions-detail-list">
                    {matches
                      .filter(m => m.status === 'finished')
                      .sort((a, b) => {
                        const mdA = matchdays[a.matchdayId];
                        const mdB = matchdays[b.matchdayId];
                        return (mdA?.number || 999) - (mdB?.number || 999);
                      })
                      .map(match => {
                        const userPred = userPredictionsData[match.id];
                        const points = userPred ? calculatePointsEarned(match, userPred) : null;
                        const matchdayData = matchdays[match.matchdayId];

                        return (
                          <div key={match.id} className="prediction-detail-card card" style={{ marginBottom: '15px', padding: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <div>
                                <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>
                                  📅 Fecha {matchdayData?.number || '?'}
                                </span>
                                {match.date && (
                                  <span style={{ fontSize: '0.85rem', color: '#888', marginLeft: '10px' }}>
                                    {new Date(match.date).toLocaleDateString('es-ES')}
                                  </span>
                                )}
                              </div>
                              {points && (
                                <span style={{
                                  fontWeight: 'bold',
                                  fontSize: '1.1rem',
                                  color: points.type === 'exact' ? '#4ade80' : 
                                         points.type === 'difference' ? '#60a5fa' :
                                         points.type === 'winner' ? '#a78bfa' : '#ef4444'
                                }}>
                                  {points.type === 'exact' && '✅ +' + points.points}
                                  {points.type === 'difference' && '🎯 +' + points.points}
                                  {points.type === 'winner' && '🏆 +' + points.points}
                                  {points.type === 'none' && '❌ 0'} pts
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                              <div style={{ flex: 1, textAlign: 'center' }}>
                                {getTeamLogo(match.homeTeam) && (
                                  <LazyImage src={getTeamLogo(match.homeTeam)} alt="" style={{ width: '40px', height: '40px', marginBottom: '5px' }} />
                                )}
                                <div style={{ fontWeight: '500' }}>{getTeamName(match.homeTeam)}</div>
                              </div>

                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '5px' }}>
                                  {match.homeScore} - {match.awayScore}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>Resultado real</div>
                                {userPred ? (
                                  <div style={{ 
                                    marginTop: '8px', 
                                    padding: '4px 8px', 
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '4px',
                                    fontSize: '0.9rem'
                                  }}>
                                    Predicción: {userPred.homeScore} - {userPred.awayScore}
                                  </div>
                                ) : (
                                  <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#ef4444' }}>
                                    Sin predicción
                                  </div>
                                )}
                              </div>

                              <div style={{ flex: 1, textAlign: 'center' }}>
                                {getTeamLogo(match.awayTeam) && (
                                  <LazyImage src={getTeamLogo(match.awayTeam)} alt="" style={{ width: '40px', height: '40px', marginBottom: '5px' }} />
                                )}
                                <div style={{ fontWeight: '500' }}>{getTeamName(match.awayTeam)}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            ) : standings.length === 0 ? (
              <div className="empty-state">
                <p className="text-secondary">No hay participantes</p>
              </div>
            ) : (
              <div className="standings-table">
                {standings.map((player, index) => (
                  <div 
                    key={player.userId} 
                    className={`standing-row ${player.userId === currentUser.uid ? 'highlight' : ''}`}
                    onClick={() => handleViewUserPredictions(player.userId, player.displayName)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div className="standing-position">
                      {index === 0 && <span className="medal">🥇</span>}
                      {index === 1 && <span className="medal">🥈</span>}
                      {index === 2 && <span className="medal">🥉</span>}
                      {index > 2 && <span className="position-number">#{index + 1}</span>}
                    </div>
                    <div className="standing-name">
                      {player.displayName}
                      {player.userId === currentUser.uid && <span className="you-badge">TÚ</span>}
                    </div>
                    <div className="standing-points">{player.points} pts</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prediction Modal */}
      {editingMatch && (
        <div className="modal-overlay" onClick={() => setEditingMatch(null)}>
          <div className="modal-content prediction-modal" onClick={e => e.stopPropagation()}>
            <h2>Hacer Predicción</h2>
            
            <div className="prediction-match-info">
              <div className="prediction-team">
                {getTeamLogo(editingMatch.homeTeam) && (
                  <LazyImage src={getTeamLogo(editingMatch.homeTeam)} alt="" />
                )}
                <span>{getTeamName(editingMatch.homeTeam)}</span>
              </div>
              
              <div className="prediction-inputs">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={predictionForm.homeScore}
                  onChange={e => setPredictionForm({...predictionForm, homeScore: e.target.value})}
                  placeholder="0"
                  autoFocus
                />
                <span className="prediction-separator">-</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={predictionForm.awayScore}
                  onChange={e => setPredictionForm({...predictionForm, awayScore: e.target.value})}
                  placeholder="0"
                />
              </div>
              
              <div className="prediction-team prediction-team-right">
                {getTeamLogo(editingMatch.awayTeam) && (
                  <LazyImage src={getTeamLogo(editingMatch.awayTeam)} alt="" />
                )}
                <span>{getTeamName(editingMatch.awayTeam)}</span>
              </div>
            </div>

            <div className="prediction-info">
              <p className="text-secondary">
                📅 {new Date(editingMatch.date).toLocaleDateString('es-ES')} • 
                🕐 {editingMatch.time}
              </p>
              <p className="text-secondary mt-1">
                ⚡ Puntos: {penca.pointsPerExactScore} por resultado exacto, {penca.pointsPerDifference || 0} por diferencia, {penca.pointsPerWinner} por ganador
              </p>
            </div>

            <div className="modal-footer">
              <button onClick={() => setEditingMatch(null)} className="btn btn-outline">
                Cancelar
              </button>
              <button 
                onClick={savePrediction} 
                className="btn btn-primary"
                disabled={predictionForm.homeScore === '' || predictionForm.awayScore === ''}
              >
                <Check size={20} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPenca;
