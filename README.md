## 💻 Requisitos Previos

* **Node.js** (v18 o v20 LTS recomendado).
* Gestor de paquetes: **pnpm** o **npm**.
* Una cuenta gratuita en [Expo.dev](https://expo.dev/) (para compilar el APK en la nube con EAS).
* Una cuenta en [Firebase Console](https://console.firebase.google.com/) (para notificaciones push FCM).

---

## 🚀 Instalación Local

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd ElderCare
   ```

2. **Instalar dependencias:**
   ```bash
   pnpm install
   npm install
---

## 🔥 Configuración de Firebase (FCM)

Para que el teléfono pueda recibir alertas remotas de la pulsera mediante Firebase Cloud Messaging:

1. Ve a [Firebase Console](https://console.firebase.google.com/) y crea un proyecto (ej. `ElderCare`).
2. Agrega una aplicación **Android**:
   * **Nombre del paquete Android:** Debe ser exactamente:
     ```
     com.eldercare.app
     ```
     *(Configurado en `app.json`)*.
3. Descarga el archivo de configuración **`google-services.json`**.
4. Coloca el archivo **`google-services.json`** en la carpeta raíz del proyecto (`ElderCare/google-services.json`).
5. En la consola web de Firebase, pulsa **Siguiente** y omite los pasos de agregar dependencias en `build.gradle` (el plugin de Expo configurado en `app.json` inyecta todo automáticamente en la compilación).

---

## 📱 Compilación del APK con EAS Build

Crear una cuenta en EAS (Expo Application Services)
### 1. Iniciar sesión en EAS
Ejecuta en tu terminal:
```bash
npx eas-cli login
```
Introduce tus credenciales de Expo.

### 2. Vincular el proyecto a tu cuenta de Expo
Si clonaste el repositorio y vas a compilar bajo tu propia cuenta:
```bash
npx eas-cli init
```
Esto asociará el proyecto a tu usuario/organización y generará un nuevo `projectId` en `app.json`.

### 3. Lanzar la compilación del APK (en la nube)
El archivo `eas.json` ya está preconfigurado con el perfil `development` para generar un archivo APK instalable:

```bash
npx eas-cli build --profile development --platform android
```

* Cuando pregunte: *"Generate a new Android Keystore?"*, selecciona **Yes** (EAS gestionará la firma en la nube).
* Espera entre 5 y 10 minutos a que termine la compilación en los servidores de Expo.
* Al finalizar, la terminal mostrará un **código QR** y un enlace de descarga.
* Abre el enlace en tu celular Android, descarga e instala el **APK**.

---

## 🛠️ Flujo de Desarrollo y Pruebas

Una vez instalado el APK de desarrollo en tu teléfono físico:

1. Asegúrate de que tu computadora y tu celular estén conectados a la **misma red WiFi**.
2. En tu computadora, arranca el servidor Metro:
   ```bash
   npx expo start
   ```
   *(Si tienes problemas de red o firewalls entre PC y celular, ejecuta con túnel: `npx expo start --tunnel`)*.
3. Abre la app instalada en tu teléfono:
   * En la pantalla del lanzador, pulsa sobre el servidor que detecte en tu red local (o escanea el QR de la terminal).
   * La app compilará el bundle JavaScript y se abrirá **ElderCare**. Tendrás recarga rápida (*Fast Refresh*) cada vez que edites código en tu editor.

---

### 1. Pruebas de Bluetooth (BLE)

La aplicación cuenta con una **Consola de Depuración BLE en tiempo real** en la pantalla de vinculación:

* **Modo MOCK (Simulado):**
  * Viene activado por defecto para permitir probar toda la interfaz y flujo sin necesidad de tener el ESP32 encendido.
  * Una contraseña de menos de 8 caracteres simula un error de conexión para verificar las alertas visuales.
* **Modo REAL (Hardware ESP32):**
  * En la pantalla de vinculación, toca el indicador superior derecho **`MOCK (X)`**.
  * Se desplegará la consola oscura de logs en vivo.
  * Toca el botón **"Cambiar a REAL"**.
  * La app solicitará permisos nativos de Bluetooth, buscará periféricos con el nombre `"ElderCare-Pulsera"`, negociará un MTU de 512 bytes, leerá las redes WiFi detectadas por la pulsera y le transmitirá las credenciales seleccionadas.
  * Cada paso queda registrado en la consola con marcas de tiempo y niveles de color (éxito, advertencia, error).

---

### 2. Pruebas de Alertas de Emergencia

Para verificar que la alarma sonora, la vibración y la pantalla roja funcionen:

#### A) Prueba Local In-App (Sin internet)
1. Ingresa a la app y completa la vinculación (usando el modo MOCK).
2. En la **Pantalla Principal (Home)**, baja hasta la caja punteada de **DESARROLLO**.
3. Pulsa **"Simular alerta"**.
4. Se disparará de inmediato la pantalla roja de Emergencia. Al pulsar **"Silenciar"**, se detendrá la alarma y quedará registrada en el Historial de Alertas.

#### B) Prueba Remota Real con Firebase (FCM)
1. En la Pantalla Principal (sección DESARROLLO), pulsa **"Compartir token FCM"** y copia el token generado.
2. Ve a [Firebase Console](https://console.firebase.google.com/) ➔ **Cloud Messaging**.
3. Crea una nueva campaña ➔ **Mensajes de Firebase Notification**.
4. Ingresa un título (`¡ALERTA!`) y texto (`Pulsera presionada`).
5. Pulsa **Enviar mensaje de prueba**, pega tu token FCM y pulsa **Probar**.
6. **Resultados esperados:**
   * *Con la app abierta:* La pantalla cambia inmediatamente a la interfaz roja de Emergencia.
   * *Con la app minimizada o celular bloqueado:* Notifee activa una notificación de alta prioridad con sonido de alarma que despierta la pantalla y lanza la actividad al interactuar con ella.

---

## 📟 Firmware de la Pulsera (ESP32)

El código listo para compilar y cargar en la pulsera se encuentra en el archivo [**`codigoArduino.cpp`**](./codigoArduino.cpp).

### Protocolo GATT BLE acordado:
* **Device Name:** `ElderCare-Pulsera`
* **Service UUID:** `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
* **Características:**
  * `CHAR_SCAN_UUID` (`beb5483e-36e1-4688-b7f5-ea07361b26a8`): Lectura (READ) del JSON con redes WiFi locales.
  * `CHAR_CREDENTIALS_UUID` (`a3c10001-2000-4000-8000-111122223333`): Escritura (WRITE) en formato `SSID;PASSWORD`.
  * `CHAR_STATUS_UUID` (`a3c10002-2000-4000-8000-111122223333`): Notificación (NOTIFY) de éxito (`{"status":"OK","id":"ECB-XXXX"}`) o fallo (`{"status":"ERROR"}`).
