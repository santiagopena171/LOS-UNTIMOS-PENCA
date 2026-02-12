# ⚽ Tu Penca Al Toque

Aplicación web completa para crear y gestionar pencas de fútbol con predicciones en tiempo real, construida con React y Firebase Realtime Database.

## ✨ Características Principales

### 👨‍💼 Para Administradores:
- ✅ Crear múltiples pencas de fútbol
- ✅ Agregar equipos con escudos (URLs desde Google Images)
- ✅ Configurar fixture completo (equipos, fecha, hora)
- ✅ Gestionar partidos y actualizar resultados en tiempo real
- ✅ Generar y compartir links de invitación
- ✅ Ver estadísticas de participantes
- ✅ Dashboard completo con todas las pencas creadas

### 👥 Para Usuarios:
- ✅ Unirse a pencas mediante link de invitación
- ✅ Hacer predicciones hasta 30 minutos antes del partido
- ✅ Ver resultados y tabla de posiciones en tiempo real
- ✅ Editar predicciones antes del cierre
- ✅ Competir con otros participantes
- ✅ Dashboard con todas las pencas activas

## 🚀 Tecnologías Utilizadas

- **Frontend:** React 18 + Vite
- **Backend:** Firebase Authentication + Realtime Database
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Styling:** CSS3 Moderno
- **💰 Costo:** 100% GRATIS (sin Storage)

## 📋 Requisitos Previos

- Node.js 16+ instalado
- Cuenta de Firebase (gratuita, sin tarjeta de crédito)
- Navegador web moderno

## 🔧 Configuración de Firebase

### Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click en "Agregar proyecto" o "Add project"
3. Nombre del proyecto: `pencas-futsal` (o el que prefieras)
4. Desactiva Google Analytics (opcional)
5. Click en "Crear proyecto"

### Paso 2: Registrar Aplicación Web

1. En la página principal del proyecto, click en el ícono **`</>`** (Web)
2. Nombre de la app: `Tu Penca Al Toque`
3. NO marques "Firebase Hosting"
4. Click en "Registrar app"
5. **IMPORTANTE:** Copia las credenciales que aparecen (ya están en el proyecto)

### Paso 3: Habilitar Authentication

1. En el menú lateral: **Build > Authentication**
2. Click en **"Get started"** o **"Comenzar"**
3. En la pestaña **"Sign-in method"**:
   - Click en **"Email/Password"**
   - Activa el switch de **"Email/Password"**
   - NO actives "Email link"
   - Click en **"Guardar"**

### Paso 4: Crear Realtime Database

1. En el menú lateral: **Build > Realtime Database**
2. Click en **"Crear base de datos"** o **"Create Database"**
3. **Ubicación:** Selecciona `us-central1` (o la más cercana)
4. **Reglas de seguridad:** Selecciona **"Comenzar en modo de prueba"**
   - ⚠️ Esto permite lectura/escritura por 30 días
   - Cambia las reglas después (ver sección de Seguridad)
5. Click en **"Habilitar"**

**IMPORTANTE:** Copia la URL de tu database. Se verá así:
```
https://pencas-futsal-default-rtdb.firebaseio.com
```

Esta URL ya está configurada en el archivo `src/config/firebase.js`

### Paso 5: Configurar Reglas de Seguridad (Importante)

#### Reglas para Realtime Database:

En **Realtime Database > Reglas**, reemplaza con esto:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    },
    "pencas": {
      ".read": "auth != null",
      "$pencaId": {
        ".write": "auth != null && (
          !data.exists() || 
          data.child('adminId').val() === auth.uid
        )",
        "participants": {
          "$userId": {
            ".write": "$userId === auth.uid"
          }
        }
      }
    },
    "predictions": {
      "$pencaId": {
        "$userId": {
          ".read": "auth != null",
          ".write": "$userId === auth.uid"
        }
      }
    }
  }
}
```

**✅ ¡Listo! Firebase está configurado y es 100% GRATIS**

## 💻 Instalación Local

### 1. Clonar o descargar el proyecto

Ya tienes el proyecto en:
```
C:\Users\Santiago Peña\OneDrive\Desktop\LOS UNTIMOS PENCA
```

### 2. Instalar dependencias

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
npm install
```

Esto instalará:
- React 18
- Firebase SDK
- React Router
- Lucide React (iconos)
- Vite (build tool)

### 3. Verificar configuración de Firebase

El archivo `src/config/firebase.js` ya tiene las credenciales configuradas. Verifica que la URL de Realtime Database sea correcta:

```javascript
databaseURL: "https://pencas-futsal-default-rtdb.firebaseio.com"
```

### 4. Iniciar servidor de desarrollo

```powershell
npm run dev
```

La aplicación se abrirá automáticamente en: **http://localhost:3000**

## 📱 Cómo Usar la Aplicación

### Primera Vez - Crear Cuenta de Administrador

1. Abre http://localhost:3000
2. Click en **"¿No tienes cuenta? Regístrate"**
3. Completa el formulario:
   - **Nombre completo:** Tu nombre
   - **Email:** tu@email.com
   - **Contraseña:** mínimo 6 caracteres
   - **Tipo de cuenta:** Selecciona **"Administrador"**
4. Click en **"Registrarse"**
5. ¡Listo! Serás redirigido al dashboard de admin

### Como Administrador - Crear una Penca

1. En el dashboard, click en **"Crear Nueva Penca"**
2. Completa:
   - **Nombre:** Ej: "Copa América 2026"
   - **Descripción:** Ej: "Penca entre amigos"
   - **Puntos por resultado exacto:** 3 (recomendado)
   - **Puntos por acertar ganador:** 1 (recomendado)
3. Click en **"Crear Penca"**

### Agregar Equipos

1. Click en **"Gestionar"** en una penca
2. En la pestaña **"Equipos"**, click en **"Agregar Equipo"**
3. Ingresa:
   - **Nombre del equipo**
   - **Logo (URL):** 
     - Ve a Google Images
     - Busca el logo del equipo
     - Click derecho en la imagen → "Copiar dirección de imagen"
     - Pega la URL
4. Repite para todos los equipos

**💡 Tip:** Busca "escudo [equipo] png" en Google Images para logos con fondo transparente

### Crear el Fixture

1. Ve a la pestaña **"Fixture"**
2. Click en **"Agregar Partido"**
3. Selecciona:
   - **Equipo Local**
   - **Equipo Visitante**
   - **Fecha y Hora** del partido
   - **Estado:** "Programado"
4. Click en **"Agregar"**
5. Repite para todos los partidos

### Compartir la Penca

1. Vuelve al dashboard principal
2. En la penca que creaste, click en **"Copiar Link"**
3. Envía el link a tus amigos por WhatsApp, email, etc.

Ejemplo de link:
```
http://localhost:3000?invite=abc123xyz
```

### Actualizar Resultados

1. Entra a **"Gestionar"** la penca
2. En **"Fixture"**, click en **"Editar"** del partido
3. Cambia el **Estado** a **"Finalizado"**
4. Ingresa los **Goles** de cada equipo
5. Click en **"Actualizar"**

¡Los puntos se calculan automáticamente!

### Como Usuario - Unirse a una Penca

1. Recibe el link de invitación
2. Si no tienes cuenta:
   - Regístrate seleccionando **"Usuario"** como tipo de cuenta
3. Inicia sesión
4. Click en el link de invitación
5. Confirma que quieres unirte
6. ¡Listo! Ya estás en la penca

### Hacer Predicciones

1. En tu dashboard, click en **"Ver Penca"**
2. En la pestaña **"Partidos"**, verás todos los encuentros
3. Para partidos que empiezan en más de 30 minutos:
   - Click en **"Hacer Predicción"**
   - Ingresa el resultado que predices
   - Click en **"Guardar"**
4. Puedes editar tu predicción hasta 30 minutos antes

### Ver Tabla de Posiciones

1. Dentro de una penca, ve a la pestaña **"Tabla de Posiciones"**
2. Verás:
   - 🥇🥈🥉 Medallas para los primeros 3 lugares
   - Tu posición destacada
   - Puntos de todos los participantes

## 🎯 Sistema de Puntos

El sistema de puntos se calcula automáticamente cuando el admin registra un resultado:

- **Resultado Exacto:** 3 puntos (editable al crear penca)
- **Acertar Ganador:** 1 punto (editable al crear penca)
- **No acertar:** 0 puntos

Ejemplo:
- Partido real: Argentina 2 - 1 Brasil
- Tu predicción: 2 - 1 → ✅ **3 puntos** (exacto)
- Tu predicción: 3 - 1 → ✅ **1 punto** (ganador correcto)
- Tu predicción: 1 - 2 → ❌ **0 puntos**

## 🛡️ Seguridad

### Reglas Implementadas:

- ✅ Solo usuarios autenticados pueden acceder
- ✅ Usuarios solo pueden editar sus propias predicciones
- ✅ Solo el admin de una penca puede modificarla
- ✅ Predicciones se cierran 30 minutos antes del partido
- ✅ Validación de roles (admin/user)

### Cambiar Reglas de Firebase (Importante para Producción):

Después de 30 días, Firebase bloqueará las reglas de "modo de prueba". Sigue las instrucciones en **Paso 6** de la configuración para establecer reglas permanentes.

## 📂 Estructura del Proyecto

```
LOS UNTIMOS PENCA/
├── public/               # Archivos estáticos
├── src/
│   ├── components/
│   │   ├── Admin/       # Componentes de administrador
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CreatePenca.jsx
│   │   │   ├── ManagePenca.jsx
│   │   │   └── Admin.css
│   │   ├── Auth/        # Login y registro
│   │   │   ├── Login.jsx
│   │   │   └── Auth.css
│   │   └── User/        # Componentes de usuario
│   │       ├── UserDashboard.jsx
│   │       ├── ViewPenca.jsx
│   │       └── User.css
│   ├── config/
│   │   └── firebase.js  # Configuración de Firebase
│   ├── contexts/
│   │   └── AuthContext.jsx  # Context de autenticación
│   ├── App.jsx          # Componente principal
│   ├── main.jsx         # Entry point
│   └── index.css        # Estilos globales
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🐛 Solución de Problemas

### "Error al crear la penca"
- Verifica que la Realtime Database esté creada
- Revisa la URL en `firebase.js`
- Asegúrate de estar autenticado

### "Los logos no se ven"
- Verifica que la URL sea válida (pruébala en el navegador)
- Usa URLs de imágenes que permitan acceso público
- Busca "escudo [equipo] png" en Google Images

### "Las predicciones no se guardan"
- Verifica las reglas de Realtime Database
- Asegúrate de que el partido esté en estado "scheduled"
- Verifica que falten más de 30 minutos

### "Error de autenticación"
- Verifica que Email/Password esté habilitado en Authentication
- Usa un email válido
- La contraseña debe tener mínimo 6 caracteres

## 🚀 Desplegar a Producción

### Opción 1: Firebase Hosting (Gratis)

```powershell
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy
```

### Opción 2: Vercel (Gratis)

1. Sube el proyecto a GitHub
2. Importa en [Vercel](https://vercel.com)
3. ¡Deploy automático!

### Opción 3: Netlify (Gratis)

1. Drag & drop la carpeta `dist` después de `npm run build`
2. O conecta tu repositorio de GitHub

## 📊 Límites del Plan Gratuito de Firebase

- **Realtime Database:**
  - 1 GB de datos almacenados
  - 10 GB/mes de descarga
  - 100 conexiones simultáneas

- **Authentication:**
  - Usuarios ilimitados

**La app NO usa Storage, por lo que es 100% GRATUITA sin necesidad de tarjeta de crédito.** 🎉

**Para una penca con 100+ usuarios y 100 partidos, esto es más que suficiente.**

## 🤝 Soporte

Si tienes problemas:

1. Revisa la consola del navegador (F12)
2. Verifica la configuración de Firebase
3. Asegúrate de que las reglas estén correctas

## 📝 Comandos Útiles

```powershell
# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 🎨 Personalización

### Cambiar colores:

Edita `src/index.css`:

```css
:root {
  --primary: #00a86b;      /* Color principal */
  --secondary: #ff6b35;    /* Color secundario */
  --dark: #1a1a2e;         /* Fondo */
}
```

### Cambiar sistema de puntos:

Al crear una penca, ajusta:
- Puntos por resultado exacto
- Puntos por acertar ganador

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🏆 ¡Que gane el mejor!

¡Disfruta de tus pencas con amigos! ⚽🎉

---

**Desarrollado con ❤️ usando React + Firebase**
