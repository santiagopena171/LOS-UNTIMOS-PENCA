# Verificar y Actualizar Reglas de Firebase Realtime Database

## Problema
El registro siempre guarda rol "user" incluso cuando seleccionas "admin"

## Posible Causa
Las reglas de seguridad de Firebase pueden estar bloqueando la escritura de rol "admin"

## ✅ PASOS A SEGUIR:

### 1. Ve a Firebase Console
1. Abre https://console.firebase.google.com
2. Selecciona tu proyecto "Pencas Futsal"
3. En el menú izquierdo, ve a **Realtime Database**
4. Haz clic en la pestaña **"Rules"** (Reglas)

### 2. Revisa las Reglas Actuales
Verás algo como esto:
```json
{
  "rules": {
    ".read": "ahora existen reglas aquí",
    ".write": "ahora existen reglas aquí"
  }
}
```

### 3. Actualiza las Reglas
Reemplaza el contenido completo con estas reglas:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".write": "auth != null && auth.uid == $uid",
        ".read": "auth != null"
      }
    },
    "pencas": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "teams": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "fixtures": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "predictions": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### 4. Publica las Reglas
1. Haz clic en el botón **"Publish"** (Publicar)
2. Confirma la publicación

### 5. Prueba el Registro
1. Refresca tu app (F5)
2. Abre la consola del navegador (F12) para ver los logs de debug
3. Intenta registrar un nuevo usuario como "Administrador"
4. Verás en la consola:
   - "Rol seleccionado cambiado a: admin"
   - "Registrando usuario con rol: admin"
   - "signup - parámetro rol recibido: admin"
   - "signup - guardando en DB: {...role: admin...}"
   - "signup - usuario guardado exitosamente con rol: admin"

### 6. Verifica en Firebase
1. Ve a la pestaña **"Data"** en Realtime Database
2. Expande: `users` → `[tu-user-id]`
3. Verifica que el campo `role` sea `"admin"`

## 📋 COPIAR/PEGAR REGLAS:
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".write": "auth != null && auth.uid == $uid",
        ".read": "auth != null"
      }
    },
    "pencas": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "teams": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "fixtures": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "predictions": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## ⚠️ NOTA IMPORTANTE
Estas reglas permiten:
- ✅ Cada usuario puede escribir SOLO sus propios datos (incluyendo su rol)
- ✅ Todos los usuarios autenticados pueden leer datos de otros usuarios
- ✅ Todos los usuarios autenticados pueden crear/modificar pencas, equipos, fixtures
- ✅ Solo usuarios autenticados pueden acceder a la app

## 🔍 Si sigue sin funcionar
Manda captura de pantalla de:
1. Los logs en la consola del navegador
2. Las reglas que tienes en Firebase
3. Los datos en Firebase Database después de registrar
