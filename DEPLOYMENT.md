# 🚀 Deployment y Configuración de Producción

## 📋 Checklist Pre-Deployment

### 1. Variables de Entorno
```bash
# Verificar que .env existe y tiene todas las variables
cat .env

# Verificar que .env está en .gitignore
grep ".env" .gitignore
```

### 2. Build de Producción
```bash
# Instalar dependencias
npm install

# Crear build de producción
npm run build

# Verificar que dist/ se creó correctamente
ls dist/
```

### 3. Reglas de Seguridad de Firebase

#### Aplicar Reglas de Realtime Database
```bash
# Instalar Firebase CLI (si no está instalado)
npm install -g firebase-tools

# Login en Firebase
firebase login

# Inicializar Firebase en el proyecto (solo primera vez)
firebase init database
# Seleccionar: pencas-futsal
# Usar archivo: database.rules.json

# Desplegar SOLO las reglas de database
firebase deploy --only database
```

#### Verificar Reglas en Console
1. Ir a: https://console.firebase.google.com/
2. Seleccionar proyecto: pencas-futsal
3. Ir a: Realtime Database > Rules
4. Verificar que las reglas se aplicaron correctamente

### 4. Deploy a Vercel

#### Primera vez
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Configurar variables de entorno en Vercel:
# 1. Ir a: https://vercel.com/dashboard
# 2. Seleccionar proyecto
# 3. Settings > Environment Variables
# 4. Agregar TODAS las variables del .env:
#    - VITE_FIREBASE_API_KEY
#    - VITE_FIREBASE_AUTH_DOMAIN
#    - VITE_FIREBASE_PROJECT_ID
#    - VITE_FIREBASE_STORAGE_BUCKET
#    - VITE_FIREBASE_MESSAGING_SENDER_ID
#    - VITE_FIREBASE_APP_ID
#    - VITE_FIREBASE_DATABASE_URL
```

#### Deployments siguientes
```bash
# Deploy a producción
vercel --prod
```

#### Configurar Dominio
1. En Vercel Dashboard: Settings > Domains
2. Agregar: `los-untimos-penca.vercel.app` (o dominio custom)

## 🔒 Seguridad Post-Deployment

### 1. Verificar Reglas de Firebase
```bash
# Test de lectura sin auth (debe fallar)
curl https://pencas-futsal-default-rtdb.firebaseio.com/users.json

# Test de escritura sin auth (debe fallar)
curl -X PUT -d '{"test": "value"}' https://pencas-futsal-default-rtdb.firebaseio.com/users/test.json
```

### 2. Rotación de Credenciales (si es necesario)
Si las credenciales fueron expuestas:
1. Firebase Console > Project Settings > Service Accounts
2. Generate New Private Key
3. Actualizar .env y variables de Vercel
4. Redeploy

## 📊 Monitoreo Post-Deployment

### 1. Firebase Usage Dashboard
1. Ir a: Firebase Console > Realtime Database > Usage
2. Configurar alertas:
   - 70% storage: Advertencia
   - 90% storage: Crítico
   - 70% bandwidth: Advertencia
   - 90% bandwidth: Crítico

### 2. Vercel Analytics
1. Ir a: Vercel Dashboard > Analytics
2. Monitorear:
   - Page load time
   - Errores de cliente
   - Tráfico

### 3. Script de Monitoreo de Uso
```javascript
// monitoring/check-usage.js
import { getDatabase, ref, get } from 'firebase/database';

async function checkDatabaseSize() {
  const db = getDatabase();
  const snapshot = await get(ref(db, '/'));
  const data = JSON.stringify(snapshot.val());
  const sizeInBytes = new Blob([data]).size;
  const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
  
  console.log(`📊 Database size: ${sizeInMB} MB`);
  
  if (sizeInMB > 700) {
    console.warn('⚠️ Warning: Database is over 70% full!');
  }
  
  if (sizeInMB > 900) {
    console.error('🔴 Critical: Database is over 90% full!');
  }
}

checkDatabaseSize();
```

## 🆘 Plan de Contingencia

### Si se alcanza el límite de Storage (1GB)
```bash
# 1. Identificar pencas grandes
# En Firebase Console, ver tamaño de cada penca

# 2. Eliminar pencas antiguas/inactivas
# Manualmente en Firebase Console o con script

# 3. Reoptimizar imágenes existentes
# Script para reducir todas las imágenes Base64

# 4. Considerar upgrade a Blaze Plan
# Firebase Console > Settings > Usage and billing > Modify plan
```

### Si se alcanza el límite de Bandwidth (10GB/mes)
```bash
# 1. Implementar caché agresivo
# 2. Activar Service Worker
# 3. Lazy loading de imágenes
# 4. Considerar CDN
# 5. Upgrade a Blaze Plan si es necesario
```

## 📝 Comandos Útiles

### Firebase
```bash
# Ver projecto actual
firebase projects:list

# Cambiar proyecto
firebase use pencas-futsal

# Ver reglas actuales
firebase database:get /

# Backup de datos
firebase database:export backup.json

# Restore de datos
firebase database:import backup.json
```

### Vercel
```bash
# Ver deployments
vercel ls

# Ver logs
vercel logs <deployment-url>

# Revertir deployment
vercel rollback <deployment-url>

# Eliminar deployment
vercel rm <deployment-url>
```

## ✅ Verificación Post-Deployment

- [ ] App carga correctamente en producción
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Crear penca funciona
- [ ] Subir imágenes funciona (< 150KB)
- [ ] Predicciones funcionan
- [ ] Tabla de posiciones actualiza
- [ ] No hay errores en browser console
- [ ] Firebase rules protegen datos
- [ ] Variables de entorno configuradas
- [ ] Monitoreo activo

## 🔗 Links Importantes

- **App en Producción**: https://los-untimos-penca.vercel.app
- **Firebase Console**: https://console.firebase.google.com/project/pencas-futsal
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Realtime Database**: https://pencas-futsal-default-rtdb.firebaseio.com

## 📞 Soporte

Si algo falla:
1. Verificar logs en Vercel
2. Verificar errores en Firebase Console
3. Revisar browser console
4. Verificar variables de entorno
5. Verificar reglas de Firebase
