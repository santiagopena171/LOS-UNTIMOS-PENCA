# Plan de Testing - Tu Penca Al Toque

## Tests Automatizados

### 1. Autenticación y Usuarios ✅
- [x] Registro de nuevo usuario con username
- [x] Validación de username (solo letras, números, guiones bajos)
- [x] Login con username y contraseña
- [x] Logout
- [x] Persistencia de sesión
- [x] Solo rol 'user' en registro
- [x] Conversión username → email interno (@pencas.app)

### 2. Panel de Administrador 🔧
- [ ] Crear nueva penca con todos los campos
- [ ] Editar nombre y descripción de penca
- [ ] Configurar puntos (exacto, diferencia, ganador)
- [ ] Ver lista de pencas propias
- [ ] Eliminar penca
- [ ] Copiar link de invitación
- [ ] Ver contador de solicitudes pendientes

### 3. Equipos y Divisionales 🔧
- [ ] Crear divisional
- [ ] Editar divisional
- [ ] Eliminar divisional
- [ ] Crear equipo con logo Base64
- [ ] Validar límite de 500KB en logos
- [ ] Editar equipo
- [ ] Eliminar equipo
- [ ] Ver equipos por divisional

### 4. Fechas y Partidos 🔧
- [ ] Crear fecha (matchday)
- [ ] Editar fecha
- [ ] Eliminar fecha
- [ ] Crear partido con equipos, fecha, hora
- [ ] Editar partido programado
- [ ] Publicar resultado de partido
- [ ] Validar que no se edite partido finalizado
- [ ] Calcular puntos automáticamente al publicar resultado

### 5. Sistema de Solicitudes 🔧
- [ ] Usuario solicita unirse a penca
- [ ] Admin ve solicitudes pendientes
- [ ] Admin aprueba solicitud → usuario agregado a participantes
- [ ] Admin rechaza solicitud → request eliminado
- [ ] Validar que no se dupliquen solicitudes
- [ ] Validar que participante no pueda solicitar de nuevo

### 6. Predicciones de Usuario 🔧
- [ ] Usuario ve partidos programados
- [ ] Usuario hace predicción antes de 30 min del partido
- [ ] Usuario edita predicción antes de 30 min
- [ ] Validar que no se edite después de 30 min
- [ ] Validar que no se edite partido en vivo
- [ ] Validar que no se edite partido finalizado
- [ ] Ver predicción propia en cada partido

### 7. Tabla de Posiciones 🔧
- [ ] Ver todos los participantes ordenados por puntos
- [ ] Ver medallas (🥇🥈🥉) para top 3
- [ ] Identificar usuario actual con "TÚ"
- [ ] Click en usuario → ver sus predicciones detalladas
- [ ] Ver solo partidos finalizados del usuario
- [ ] Ver puntos ganados por predicción

### 8. Vista de Predicciones de Partido 🔧
- [ ] Click en partido finalizado → ver todas las predicciones
- [ ] Ver predicción de cada participante
- [ ] Ver puntos ganados por cada uno
- [ ] Ordenar por puntos (mayor a menor)
- [ ] Identificar usuario actual
- [ ] Ver "Sin predicción" para quienes no jugaron

### 9. Filtros y Navegación 🔧
- [ ] Filtrar partidos por fecha
- [ ] Filtrar partidos por divisional
- [ ] Navegación: Divisionales → Equipos/Fechas → Partidos
- [ ] Botón volver desde cada nivel
- [ ] Tabs: Partidos / Tabla de Posiciones

### 10. Optimización y Performance 🔧
- [ ] Verificar que no se carguen todas las pencas de una vez
- [ ] Ocultar pencas sin admin
- [ ] Validar tamaño de imágenes antes de subir
- [ ] No recargar datos innecesariamente
- [ ] Usar onValue con { onlyOnce: true } donde sea posible

---

## Tests Manuales Críticos

### Escenario 1: Liga Completa (6 meses)
**Objetivo**: Simular uso real de una liga larga

1. Crear penca "Liga de Prueba"
2. Crear 2 divisionales
3. Crear 10 equipos con logos
4. Crear 20 fechas
5. Crear 100 partidos distribuidos
6. Invitar 5 usuarios
7. Cada usuario hace predicciones en 50 partidos
8. Publicar resultados de 50 partidos
9. Verificar cálculo de puntos
10. Verificar tabla de posiciones

**Métricas a verificar**:
- Tiempo de carga del dashboard
- Tiempo de carga de la penca
- Uso de almacenamiento en Firebase Console
- Uso de bandwidth en Firebase Console

### Escenario 2: Stress Test - Predicciones Simultáneas
**Objetivo**: Verificar concurrencia

1. 5 usuarios entran simultáneamente
2. Todos hacen predicciones en los mismos 10 partidos
3. Admin publica resultado
4. Verificar que todos los puntos se calculen correctamente
5. Verificar que no haya conflictos de escritura

### Escenario 3: Límites y Validaciones
**Objetivo**: Verificar que las reglas de seguridad funcionen

1. Intentar subir imagen de 1MB (debe fallar)
2. Intentar editar predicción después de 30 min (debe fallar)
3. Intentar editar penca de otro admin (debe fallar)
4. Intentar modificar puntos manualmente (debe fallar)
5. Intentar crear username con caracteres especiales (debe fallar)

### Escenario 4: Recuperación de Errores
**Objetivo**: Verificar manejo de errores

1. Desconectar internet → intentar hacer predicción
2. Reconectar → verificar que se sincronice
3. Borrar usuario admin → verificar que penca se oculte
4. Solicitar unirse 2 veces → verificar que no se duplique

---

## Checklist Pre-Producción

### Seguridad
- [ ] Reglas de Firebase implementadas
- [ ] Variables de entorno configuradas
- [ ] .env en .gitignore
- [ ] Sin console.log con datos sensibles
- [ ] Validación de inputs en frontend y backend

### Performance
- [ ] Imágenes optimizadas (< 500KB)
- [ ] Lazy loading implementado
- [ ] Caché de datos estáticos
- [ ] No queries innecesarias

### UX/UI
- [ ] Mensajes de error claros
- [ ] Loading states en todas las acciones
- [ ] Confirmaciones para acciones destructivas
- [ ] Responsive en móvil
- [ ] Iconos y colores consistentes

### Monitoreo
- [ ] Firebase Usage dashboard configurado
- [ ] Alertas de límites configuradas
- [ ] Plan de contingencia documentado

---

## Resultados de Tests

### ✅ Completados
- Autenticación con username
- Registro solo como usuario
- Rutas protegidas por rol
- Cálculo de puntos automático
- Sistema de solicitudes

### ⚠️ Pendientes de Optimización
- Paginación de pencas
- Caché de equipos/partidos
- Límite más estricto en imágenes (100KB)
- Índices en Firebase

### 🔴 Bugs Encontrados
- (Ninguno por ahora)

---

## Próximos Pasos

1. **Implementar tests automatizados** con Jest/Vitest
2. **Deploy de reglas de Firebase** con `firebase deploy --only database`
3. **Configurar alertas** en Firebase Console
4. **Implementar monitoreo** de uso en dashboard
5. **Crear backup automático** de datos críticos
