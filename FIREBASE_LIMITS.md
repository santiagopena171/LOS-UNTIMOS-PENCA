# Firebase Realtime Database - Límites y Optimizaciones

## Límites Plan Gratuito (Spark)
- ✅ **Almacenamiento**: 1 GB
- ⚠️ **Descarga**: 10 GB/mes (CRÍTICO para app con muchos usuarios)
- ✅ **Conexiones simultáneas**: 100
- ✅ **Operaciones**: Sin límite

## Estado Actual de Uso

### Estructura de Datos
```
/users/{uid}
  - username, displayName, role, createdAt

/usernames/{username}
  - uid (mapping para búsqueda)

/pencas/{pencaId}
  - adminId, name, description, status
  - pointsPerExactScore, pointsPerDifference, pointsPerWinner
  - teams/{teamId}: name, logo (BASE64 - ⚠️ GRAN CONSUMO)
  - divisionals/{divisionalId}: name
  - matchdays/{matchdayId}: number, divisionalId
  - matches/{matchId}: homeTeam, awayTeam, date, time, status, homeScore, awayScore
  - participants/{userId}: displayName, username, points, joinedAt
  - pendingRequests/{userId}: displayName, username, requestedAt, status

/predictions/{pencaId}/{userId}/{matchId}
  - homeScore, awayScore, predictedAt
```

## ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. Imágenes Base64 (MAYOR RIESGO)
**Problema**: Un logo de 50KB × 20 equipos × 10 pencas = 10 MB solo en logos
**Solución actual**: Límite de 500KB por imagen
**Riesgo**: En una liga larga con muchos equipos, puede consumir mucho almacenamiento

### 2. Lecturas Excesivas
**Problema**: Cada vez que se carga el dashboard se leen TODAS las pencas
**Optimización necesaria**: Paginación y lazy loading

### 3. Sin Índices
**Problema**: Consultas lentas sin índices definidos
**Solución**: Definir índices en firebase.json

## OPTIMIZACIONES IMPLEMENTADAS

### ✅ 1. Filtro de Pencas Huérfanas
- Oculta pencas sin admin para no mostrar datos basura

### ✅ 2. Estructura Plana
- Predicciones separadas de pencas para optimizar lecturas

### ✅ 3. Participantes como Map
- Búsqueda O(1) en vez de arrays

## OPTIMIZACIONES PENDIENTES

### 🔧 1. Paginación en Dashboards
```javascript
// Cargar solo las primeras 20 pencas
const pencasRef = ref(database, 'pencas');
const query = query(pencasRef, orderByChild('createdAt'), limitToLast(20));
```

### 🔧 2. Caché Local
```javascript
// Usar localStorage para cachear datos estáticos (equipos, partidos)
```

### 🔧 3. Listeners Selectivos
```javascript
// Solo escuchar cambios en la penca actual, no todas
onValue(ref(database, `pencas/${pencaId}`), callback, { onlyOnce: true });
```

### 🔧 4. Comprimir Logos Base64
- Reducir calidad de imágenes antes de convertir a Base64
- Límite más estricto: 100KB por imagen

## MONITOREO

### Comandos para Verificar Uso
```bash
# En Firebase Console
# 1. Ir a: Realtime Database > Usage
# 2. Verificar:
#    - Storage used
#    - Bandwidth (download)
#    - Connections
```

### Alertas Recomendadas
- ⚠️ 70% del almacenamiento usado
- ⚠️ 70% del bandwidth mensual usado
- 🔴 90% de cualquier límite

## PLAN DE CONTINGENCIA

### Si se alcanza el límite de 1GB:
1. Eliminar pencas antiguas/inactivas
2. Recomprimir todas las imágenes
3. Migrar a plan Blaze (pago por uso)

### Si se alcanza el límite de 10GB/mes:
1. Implementar caché agresivo
2. Paginación obligatoria
3. Lazy loading de imágenes
4. Considerar CDN para assets estáticos

## ESTIMACIÓN DE CAPACIDAD

### Escenario: Liga de 6 meses
- 10 pencas simultáneas
- 50 usuarios por penca
- 20 equipos por penca
- 30 fechas por penca
- 10 partidos por fecha

**Almacenamiento estimado**:
- Usuarios: 50 users × 10 pencas × 1KB = 500KB
- Equipos: 20 teams × 10 pencas × 50KB (logo) = 10MB
- Partidos: 300 matches × 10 pencas × 0.5KB = 1.5MB
- Predicciones: 300 matches × 50 users × 10 pencas × 0.1KB = 15MB
- **TOTAL**: ~27MB (2.7% del límite) ✅

**Descarga mensual estimada**:
- Carga dashboard: 50 users × 30 días × 100KB = 150MB
- Carga penca: 50 users × 300 veces × 500KB = 7.5GB
- **TOTAL**: ~7.65GB (76.5% del límite) ⚠️

**CONCLUSIÓN**: El almacenamiento está bien, pero el bandwidth puede ser crítico con uso intensivo.
