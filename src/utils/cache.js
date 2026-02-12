// Cache utility para reducir bandwidth de Firebase
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const cache = {
  get: (key) => {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;
      
      const { data, timestamp } = JSON.parse(item);
      const now = Date.now();
      
      // Verificar si el caché expiró
      if (now - timestamp > CACHE_DURATION) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  },

  set: (key, data) => {
    try {
      const item = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Error writing cache:', error);
      // Si localStorage está lleno, limpiar caché antiguo
      if (error.name === 'QuotaExceededError') {
        cache.clearOld();
        // Intentar de nuevo
        try {
          localStorage.setItem(`cache_${key}`, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Cache still full after cleanup');
        }
      }
    }
  },

  remove: (key) => {
    localStorage.removeItem(`cache_${key}`);
  },

  clearAll: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  },

  clearOld: () => {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (now - item.timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Si hay error parseando, eliminar
          localStorage.removeItem(key);
        }
      }
    });
  }
};

// Helper para generar claves de caché
export const getCacheKey = (type, id) => {
  return `${type}_${id}`;
};
