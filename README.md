# Cafetería 802 - App Móvil

Aplicación móvil para la gestión de pedidos y administración de una cafetería. Desarrollada con React Native y Expo.

## Tecnologías Principales

- **Framework:** React Native, Expo (`~54.0.33`)
- **Navegación:** React Navigation V7 (Stack & Bottom Tabs)
- **Estado Global:** React Context API (`AuthContext`, `CarritoContext`)
- **Cliente HTTP:** Axios (con interceptores para JWT)
- **Almacenamiento Local:** AsyncStorage
- **Gestión de QR:** `expo-camera` para el escáner y `react-native-qrcode-svg` para generación.
- **Archivos e Imágenes:** `expo-image-picker`, `expo-file-system`

## Estructura del Proyecto

```text
cafeteria802/
├── app/
│   ├── components/      # Componentes reutilizables (OrdenCard, ProductoCard)
│   ├── context/         # Estados globales (Auth, Carrito)
│   ├── navigation/    # Rutas por rol (AdminNavigator, EstudianteNavigator, etc.)
│   ├── screens/         # Pantallas organizadas por roles
│   │   ├── admin/       # Dashboard, Inventario, Gestión de Productos
│   │   ├── auth/        # Pantallas de Login y Registro
│   │   ├── estudiante/  # Menú, Carrito, Pedidos, Perfil, QR Token
│   │   └── personal/    # Pedidos pendientes, Escáner QR, Perfil
│   ├── services/        # Configuración central de Axios (`api.js`)
│   └── utils/           # Utilidades y helpers (ej. `fecha.js`)
├── assets/              # Iconos, fuentes y otros archivos estáticos
├── App.js               # Punto de entrada de la app (Root)
└── package.json         # Dependencias e información del proyecto
```

##  Roles de Usuario y Funcionalidades

El sistema está dividido en tres flujos principales basados en el rol del usuario autenticado:

### 1. ESTUDIANTE (Cliente)
- Explora los productos disponibles en el **Menú**.
- Agrega productos al **Carrito** y confirma su pedido.
- Revisa el estado de sus órdenes e historial.
- Genera y visualiza un **Código QR** para identificar su pedido activo al momento de recogerlo en la cafetería.

### 2. PERSONAL (Cafetería)
- Visualiza la lista de **Pedidos Activos** o en preparación.
- Accede a un **Escáner de QR** (usando la cámara) para validar y marcar los pedidos entregados a los estudiantes de forma rápida.

### 3. ADMIN (Administrador)
- Accede a un **Dashboard** global.
- Gestiona el **Inventario** y la sección de **Productos** (crear, editar, subir imágenes, listar).

##  Endpoints del Backend (Referencia)

La configuración base del backend local se encuentra en `app/services/api.js`. Utiliza un servidor apuntando a `http://192.168.99.171:3000/api` (ajustable según la IP del desarrollador).  

*Algunos endpoints comunes utilizados por la app:*

- **Autenticación:**
  - `POST /auth/login`: Autentica al usuario y devuelve el token JWT y su información.

- **Productos:**
  - `GET /productos`: Lista el inventario/menú.
  - `POST /productos` / `PUT /productos/:id`: (Por admin) Crea o actualiza productos, enviando imágenes en Base64 o FormData.

- **Pedidos:**
  - `POST /pedidos`: Crea un carrito/orden para un estudiante.
  - `GET /pedidos`: Lista todas las órdenes (Personal/Admin).
  - `GET /pedidos/usuario/:id`: Historial de usuario.
  - `PUT /pedidos/:id/estado`: Actualiza el estatus de la orden (Preparando, Listo, Entregado vía QR).

## Configuración y Ejecución Local

1. **Instalar dependencias necesarias:**
   ```bash
   npm install
   ```

2. **Ajustar servidor de Backend:**
   Entra al archivo `app/services/api.js` y cambia la propiedad `baseURL` (ej: `http://192.168.99.171:3000/api`) con la dirección IP local de tu ordenador si vas a usar un dispositivo físico, o `localhost` para simuladores.

3. **Ejecutar Expo (Servidor de Desarrollo):**
   ```bash
   npx expo start
   ```

4. **Probar la App:**
   - Para Android, pulsa `a` y se abrirá el emulador de Android.
   - Para iOS, pulsa `i` (requiere macOS) y se abrirá en Simulador de XCode.
   - O descarga **Expo Go** en tu celular y escanea el código QR que muestra tu terminal en PC (ambos dispositivos deben estar conectados al mismo Wi-Fi).

## Seguridad y Sesión
Se utiliza `AsyncStorage` para mantener la sesión del usuario guardando su Token JWT y data básica. Además, axios interviene (interceptors) en las llamadas API adjuntando este Token como encabezado (Bearer) para su verificación.