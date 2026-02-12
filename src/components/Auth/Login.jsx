import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        if (username.length < 3) {
          setError('El nombre de usuario debe tener al menos 3 caracteres');
          setLoading(false);
          return;
        }
        // Validar caracteres permitidos en username
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          setError('El nombre de usuario solo puede contener letras, números y guiones bajos');
          setLoading(false);
          return;
        }
        console.log('Registrando usuario con rol:', role);
        await signup(username, password, displayName, role);
      }
    } catch (error) {
      console.error(error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Este nombre de usuario ya está registrado');
          break;
        case 'auth/invalid-email':
          setError('Nombre de usuario inválido');
          break;
        case 'auth/user-not-found':
          setError('Usuario no encontrado');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta');
          break;
        default:
          setError('Error al autenticar. Intenta nuevamente.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>⚽ Tu Penca Al Toque</h1>
          <p className="text-secondary">
            {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Tu nombre"
              />
            </div>
          )}

          <div className="form-group">
            <label>Nombre de usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="usuario123"
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
            />
            {!isLogin && (
              <small className="text-secondary" style={{ display: 'block', marginTop: '5px' }}>
                Solo letras, números y guiones bajos
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#888',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Tipo de cuenta</label>
              <select 
                value={role} 
                onChange={(e) => {
                  console.log('Rol seleccionado cambiado a:', e.target.value);
                  setRole(e.target.value);
                }}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
              <small className="text-secondary">
                {role === 'admin' 
                  ? 'Podrás crear y gestionar pencas' 
                  : 'Podrás unirte a pencas y hacer predicciones'}
              </small>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <button 
            className="btn-link"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin 
              ? '¿No tienes cuenta? Regístrate' 
              : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
