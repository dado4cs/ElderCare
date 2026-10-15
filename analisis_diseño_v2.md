# **DOCUMENTO DE ANÁLISIS Y DISEÑO v2**

**Proyecto:** Elder Care
**Plataforma:** React Native / Expo (SDK 57)
**Responsable del Frontend:** José Luis Villalobos Jiménez
**Versión:** 2.0 — basada en v1 + decisiones de arquitectura confirmadas el 2026-10-14

> **Nota:** Este documento supercede al `analisis_diseño.md` (v1) en todo lo que se refiere a decisiones de implementación. El prototipo visual de la v1 sigue siendo la referencia de diseño.

---

## **1. INTRODUCCIÓN Y ALCANCE**

Esta aplicación permitirá al cuidador recibir una alerta en caso de que la pulsera del adulto mayor sea presionada.

La app corre en **iOS y Android únicamente** (sin soporte web). El desarrollo prioritario es **Android primero**, iOS después.

---

## **2. CASOS DE USO DEL FRONTEND**

### **CU-01: Vinculación de pulsera**

| Campo | Detalle |
|:------|:--------|
| **Descripción** | Conectar la pulsera a internet pasándole las credenciales del WiFi de hogar mediante Bluetooth, así como también crear un identificador único de la pulsera. |
| **Actores** | Cuidador, pulsera (ESP32), aplicación |
| **Precondiciones** | Pulsera en modo vincular para conectarse mediante Bluetooth. Bluetooth del móvil activado. |
| **Flujo Básico** | 1. Se conecta a la pulsera mediante Bluetooth (react-native-ble-plx). 2. La aplicación envía a la pulsera una orden de escaneo de redes WiFi. 3. En pantalla se muestra la lista de redes WiFi escaneada y se selecciona una. 4. Se ingresa la contraseña de dicha red. 5. La aplicación envía los datos a la pulsera y ésta los recibe. 6. La pulsera confirma que la conexión funciona correctamente y devuelve un estado de aceptación. |
| **Flujo Alternativo** | Si el cuidador escribió mal la contraseña, el Bluetooth falla o se apaga durante el envío de datos, o fallos relacionados; la pulsera no logra establecer conexión a internet y se regresa al paso 2, mostrando un error en pantalla. |
| **Post Condiciones** | El identificador único de la pulsera se guarda en **AsyncStorage**. La pantalla pasa a la **Pantalla 2 (Principal)**. |

### **CU-02: Recibo de alerta**

| Campo | Detalle |
|:------|:--------|
| **Descripción** | Se recibe una alerta por parte de la pulsera. |
| **Actores** | Cuidador, Firebase (FCM), Notifee |
| **Precondiciones** | La pulsera ya está vinculada correctamente y conectada a internet. |
| **Flujo Básico** | 1. Se recibe un mensaje FCM desde Firebase, disparado por el backend. 2. Notifee intercepta el mensaje y despierta el celular (incluso con pantalla bloqueada). 3. Se muestra la **Pantalla 4 (Emergencia)** — reemplaza toda la UI. 4. Se reproduce un sonido de alarma. 5. El cuidador presiona el botón de **Silenciar**. 6. La alarma se detiene y se registra la alerta en el historial local. |
| **Flujo Alternativo** | — |
| **Post Condiciones** | La alarma sonora se detiene. La fecha y hora de la alerta se guardan automáticamente en **AsyncStorage**. La app regresa a la pantalla principal. |

---

## **3. REQUERIMIENTOS**

### **3.1 Requerimientos Funcionales**

| ID | Descripción | Prioridad |
|:---|:------------|:----------|
| **RF-00** | La aplicación debe solicitar y obtener permisos nativos de notificaciones y superposición en la pantalla (especialmente en Android). | MUST HAVE |
| **RF-01** | La aplicación debe recibir una estructura de datos con las redes WiFi disponibles desde el ESP32 vía Bluetooth (react-native-ble-plx). | MUST HAVE |
| **RF-02** | El sistema debe permitir al usuario ingresar y guardar localmente (AsyncStorage) el identificador de la pulsera vinculada. | MUST HAVE |
| **RF-03** | El sistema debe desplegar la Pantalla 4 (Emergencia) como pantalla dedicada que reemplaza toda la UI, incluso con el celular bloqueado. | MUST HAVE |
| **RF-04** | La aplicación debe interceptar los mensajes de Firebase (FCM) mediante Notifee, tanto en foreground, background como killed state. | MUST HAVE |
| **RF-05** | La aplicación debe reproducir un sonido de alarma personalizado al recibir una alerta. | MUST HAVE |
| **RF-06** | La interfaz de emergencia debe proveer un único botón de **Silenciar** que detiene la alarma y guarda automáticamente el registro en el historial local. | MUST HAVE |
| **RF-07** | La aplicación debe tener una sección donde ver el historial de alertas (fecha y hora de cada alerta), almacenado en AsyncStorage. | NICE TO HAVE |
| **RF-08** | La aplicación debe obtener el Device Token (FCM token) desde Firebase y enviarlo al servidor backend mediante un **POST REST** al iniciar la app. | MUST HAVE |
| **RF-09** | Al abrir la app, si ya existe una pulsera vinculada (ID en AsyncStorage), navegar directamente a la Pantalla 2 (Principal). Si no hay pulsera, ir a la Pantalla 0 (Bienvenida). | MUST HAVE |
| **RF-10** | La sección de batería de la pulsera debe estar **modularizada** para permitir futura implementación. El ESP32 enviará el nivel de batería vía un POST a un endpoint del backend; la app recibirá y mostrará este dato cuando esté disponible. Por ahora: mostrar un componente placeholder. | NICE TO HAVE |

### **3.2 Requerimientos No Funcionales**

| ID | Descripción | Prioridad |
|:---|:------------|:----------|
| **RNF-01** | La Pantalla 4 (Emergencia) debe tener alto contraste: fondo rojo intenso, texto e íconos blancos de gran tamaño. | MUST HAVE |
| **RNF-02** | La aplicación debe renderizar la Pantalla 4 en un tiempo máximo de 1 a 2 segundos tras interceptar el mensaje de Firebase. | MUST HAVE |
| **RNF-03** | La app debe adaptarse al tema del sistema operativo (modo claro / modo oscuro) usando `useColorScheme`. | SHOULD HAVE |
| **RNF-04** | Las plataformas soportadas son iOS y Android. Sin soporte web. | MUST HAVE |
| **RNF-05** | El desarrollo prioriza Android; la compatibilidad con iOS se validará en una segunda etapa. | INFO |

---

## **4. PROTOTIPO**

> Las imágenes de referencia se encuentran en `analisis_diseño.md` (v1). Los estilos se implementarán con **StyleSheet de React Native** respetando visualmente dichas imágenes.

- **Pantalla 0 — Bienvenida / Guía de vinculación:**
  Se mostrará una guía de cómo conectar la pulsera. Solo se muestra cuando no hay pulsera vinculada.

- **Pantalla 1 — Vinculación con pulsera (BLE):**
  La pulsera mandará una lista de redes WiFi para seleccionar una de ellas, y luego mandarle la contraseña. Muestra errores en caso de fallo de BLE o contraseña incorrecta.

- **Pantalla 2 — Pantalla Principal:**
  Se confirmará que el dispositivo está conectado. Componente de batería modularizado (placeholder por ahora). Acceso a la pantalla de historial de alertas.

- **Pantalla 3 — Historial de alertas:**
  Lista con las alertas pasadas. Cada entrada muestra: **fecha y hora** de la alerta. Datos guardados localmente en AsyncStorage.

- **Pantalla 4 — Pantalla de Emergencia:**
  Pantalla dedicada que reemplaza toda la UI (incluso con el celular bloqueado). Fondo rojo, símbolo de exclamación grande, botón prominente de **Silenciar**. Al silenciar: se detiene la alarma, se guarda el registro y se regresa a la Pantalla 2.

---

## **5. ARQUITECTURA FRONTEND**

### **5.1 Stack Tecnológico**

| Tecnología | Uso | Estado |
|:-----------|:----|:-------|
| **React Native 0.86** | Framework base | ✅ Instalado |
| **Expo SDK 57** | Plataforma y herramientas | ✅ Instalado |
| **React Navigation Stack** | Navegación entre pantallas | 🔧 Por instalar (`@react-navigation/native`, `@react-navigation/stack`) |
| **react-native-ble-plx** | Comunicación Bluetooth con ESP32 | 🔧 Por instalar |
| **@notifee/react-native** | Notificaciones de alta prioridad, despertar pantalla | 🔧 Por instalar |
| **@react-native-firebase/app** + **messaging** | FCM token, recepción de mensajes | 🔧 Por instalar |
| **@react-native-async-storage/async-storage** | Persistencia local (ID pulsera, historial) | 🔧 Por instalar |
| **React Context + useReducer** | Estado global de la app | 🔧 Por implementar (sin dependencia extra) |
| **EAS Build** | Compilación en la nube | ✅ Disponible vía `bunx eas-cli` |
| **StyleSheet (React Native)** | Estilos, siguiendo el prototipo visual de la v1 | ✅ Nativo |

> **Nota importante:** El proyecto actualmente tiene **Expo Router** configurado (`src/app/`, `expo-router` en `package.json`). La migración a React Navigation Stack implica:
> - Eliminar `expo-router` y `"main": "expo-router/entry"` de `package.json`
> - Cambiar `"main"` a `"index.js"` y crear dicho archivo
> - Instalar `@react-navigation/native` y `@react-navigation/stack`
> - Mover la lógica de rutas de `src/app/` al navigator

### **5.2 Estructura de Carpetas**

```
ElderCare/
├── index.js                        # Entry point (reemplaza expo-router/entry)
├── app.json
├── package.json
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx         # Stack Navigator principal + lógica de ruta inicial
    ├── screens/
    │   ├── WelcomeScreen.tsx        # Pantalla 0 — Guía de vinculación
    │   ├── PairingScreen.tsx        # Pantalla 1 — Vinculación BLE
    │   ├── HomeScreen.tsx           # Pantalla 2 — Principal
    │   ├── AlertHistoryScreen.tsx   # Pantalla 3 — Historial de alertas
    │   └── EmergencyScreen.tsx      # Pantalla 4 — Emergencia
    ├── components/
    │   ├── BatteryWidget.tsx        # Componente modularizado de batería (placeholder)
    │   ├── AlertHistoryItem.tsx     # Ítem del historial de alertas
    │   └── ui/                      # Componentes de UI reutilizables (botones, textos, etc.)
    ├── context/
    │   ├── AppContext.tsx           # Context + useReducer (estado global)
    │   └── AppProvider.tsx          # Provider que envuelve el árbol
    ├── hooks/
    │   ├── useBLE.ts                # Hook de BLE (react-native-ble-plx)
    │   ├── useNotifications.ts      # Hook de Notifee + FCM
    │   └── useColorScheme.ts        # Hook del tema del sistema
    ├── services/
    │   ├── storage.ts               # Wrappers de AsyncStorage (pulsera ID, historial)
    │   ├── fcm.ts                   # Lógica de FCM token + POST al backend
    │   └── alarm.ts                 # Reproducción y detención del sonido de alarma
    ├── constants/
    │   └── theme.ts                 # Colores, tipografía, dimensiones (claro/oscuro)
    └── types/
        └── index.ts                 # Tipos TypeScript compartidos
```

### **5.3 Manejo de Estado Global (Context + useReducer)**

El estado global manejará:

```typescript
type AppState = {
  braceletId: string | null;       // ID de la pulsera vinculada (null = sin pulsera)
  isEmergencyActive: boolean;      // true cuando hay una alerta activa
  alertHistory: AlertRecord[];     // Historial de alertas
  batteryLevel: number | null;     // Nivel de batería (null hasta implementación futura)
};

type AlertRecord = {
  id: string;
  timestamp: string;               // ISO 8601 — solo fecha y hora
};
```

### **5.4 Flujo de Inicio de la App**

```
App abre
  │
  ▼
AppProvider carga AsyncStorage
  │
  ├── braceletId === null ──► Pantalla 0 (Bienvenida)
  │                              │
  │                              ▼ (vinculación exitosa)
  │                          Pantalla 2 (Principal)
  │
  └── braceletId !== null ──► Pantalla 2 (Principal)
```

### **5.5 Flujo de Alerta de Emergencia**

```
FCM mensaje recibido (foreground / background / killed)
  │
  ▼
Notifee intercepta → despierta pantalla (fullScreenIntent en Android)
  │
  ▼
isEmergencyActive = true → AppNavigator navega a EmergencyScreen
  │
  ▼
Sonido de alarma inicia (alarm.ts)
  │
  ▼
Usuario pulsa "Silenciar"
  │
  ▼
Sonido se detiene
AlertRecord se guarda en AsyncStorage
isEmergencyActive = false
  │
  ▼
Regresa a Pantalla 2 (Principal)
```

### **5.6 Comunicación con el Backend**

| Evento | Acción | Endpoint |
|:-------|:-------|:---------|
| App inicia | POST del FCM token al servidor | `POST /api/device-token` |
| (Futuro) Pulsera reporta batería | GET o recepción via FCM payload | Por definir con el backend |

**Esquema del POST de FCM token:**
```json
POST /api/device-token
{
  "fcmToken": "string",
  "braceletId": "string | null",
  "platform": "android | ios"
}
```

### **5.7 Permisos Nativos Requeridos (RF-00)**

#### Android (`app.json` → `android.permissions`)
- `BLUETOOTH` / `BLUETOOTH_ADMIN` / `BLUETOOTH_CONNECT` / `BLUETOOTH_SCAN` — para BLE
- `ACCESS_FINE_LOCATION` — requerido por BLE en Android
- `RECEIVE_BOOT_COMPLETED` — para notificaciones post-reboot
- `SYSTEM_ALERT_WINDOW` — superposición de pantalla de emergencia
- `USE_FULL_SCREEN_INTENT` — despertar pantalla con Notifee

#### iOS (`app.json` → `ios.infoPlist`)
- `NSBluetoothAlwaysUsageDescription`
- `NSBluetoothPeripheralUsageDescription`
- Permisos de notificaciones (solicitados en runtime vía Notifee)

---

## **6. ORDEN DE DESARROLLO**

El desarrollo sigue el orden del prototipo:

| Fase | Pantalla | Descripción | Dependencias clave |
|:-----|:---------|:------------|:-------------------|
| **0** | Setup | Migración de Expo Router → React Navigation, instalación de dependencias, configuración de permisos en app.json | Todas las libs |
| **1** | Pantalla 0 | Pantalla de bienvenida / guía de vinculación | — |
| **2** | Pantalla 1 | Vinculación BLE con ESP32 | react-native-ble-plx |
| **3** | Pantalla 2 | Pantalla principal con estado de conexión y widget de batería (placeholder) | AsyncStorage, Context |
| **4** | Pantalla 3 | Historial de alertas | AsyncStorage |
| **5** | Pantalla 4 | Pantalla de emergencia | Notifee, FCM, alarm.ts |
| **6** | Integración | POST del FCM token al backend, pruebas end-to-end | Backend endpoint |

---

## **7. DEPENDENCIAS A INSTALAR**

> Usar siempre `npx expo install` para resolver versiones compatibles con el SDK 57.

```bash
# Navegación
npx expo install @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context

# BLE
npx expo install react-native-ble-plx

# Firebase (FCM)
npx expo install @react-native-firebase/app @react-native-firebase/messaging

# Notifee (notificaciones de alta prioridad)
npx expo install @notifee/react-native

# AsyncStorage
npx expo install @react-native-async-storage/async-storage
```

> ⚠️ Estas librerías contienen **código nativo**. Después de instalarlas se necesita un **Development Build** (`npx expo run:android` o `eas build --profile development`). Expo Go no será suficiente.

> ⚠️ `@react-native-firebase` requiere configuración adicional en `app.json` (google-services.json para Android, GoogleService-Info.plist para iOS). Documentar este paso en el README.

---

## **8. PENDIENTES / DECISIONES ABIERTAS**

| ID | Tema | Estado |
|:---|:-----|:-------|
| **P-01** | URL base del endpoint del backend (`POST /api/device-token`) | ⏳ Por definir con el equipo de backend |
| **P-02** | Formato exacto del payload de FCM que envía el backend cuando la pulsera es presionada | ⏳ Por definir con el equipo de backend |
| **P-03** | Formato y endpoint por el que el backend recibe/retransmite el nivel de batería de la pulsera | ⏳ Por definir — componente `BatteryWidget` quedará como placeholder hasta entonces |
| **P-04** | Sonido de alarma personalizado — ¿se proporciona el archivo de audio? ¿o se usa uno de sistema? | ⏳ Por definir |
| **P-05** | Validación en iOS: comportamiento de Notifee con `fullScreenIntent` en iOS vs Android | ⏳ Validar en segunda etapa (Android primero) |
