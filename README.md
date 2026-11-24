# Hito-4
## Marketplace UNAB - Aplicación móvil

Marketplace UNAB Móvil es una aplicación desarrollada con React Native y Expo que permite explorar productos, consultar detalles, administrar favoritos, revisar pedidos y gestionar el perfil de usuario.

La aplicación utiliza el mismo backend NestJS y las mismas bases de datos que la versión web.

Consulta el [diagrama de arquitectura](docs/Arquitectura.png) y la [documentación técnica](docs/arquitectura-hito4.md).

### Requisitos previos

- Node.js y npm.
- Docker Desktop con Docker Compose.
- Android Studio con Android SDK y emulador configurado.
- ADB disponible desde la terminal.
- Repositorio del proyecto descargado.

### 1. Iniciar el backend

Desde la carpeta raíz del proyecto:

```powershell
docker compose up -d --build
```

Comprobar el estado del backend en:

http://localhost:3000/api/health

La respuesta debe indicar que PostgreSQL y MongoDB están disponibles.

### 2. Instalar las dependencias móviles

Desde la carpeta raíz del proyecto:

```powershell
cd mobile
npm ci
```

### 3. Configurar la conexión con la API

Crear `mobile/.env` a partir de `mobile/.env.example`.

Configuración propuesta para el emulador Android:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

Como alternativa, en nuestras pruebas se utilizó la redirección ADB.

Con el emulador encendido:

```powershell
adb reverse tcp:3000 tcp:3000
```

Configurar `mobile/.env` con:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api
```

Esta alternativa requiere mantener activa la redirección ADB.

El archivo `.env` es local y no debe subirse a GitHub.

### 4. Ejecutar la aplicación en Android

Iniciar el emulador desde Android Studio.

Desde la carpeta `mobile`, ejecutar:

```powershell
npx expo start -c
```

Cuando Expo esté funcionando, presionar `a` para abrir la aplicación en Android.

Si se modifica la URL de la API, reiniciar Expo.


### 5. Funcionalidades móviles

La aplicación ofrece las siguientes funcionalidades:

**Autenticación**
- Inicio de sesión mediante correo y contraseña.
- Validación de credenciales y mensajes de error.
- Almacenamiento de sesión mediante Expo SecureStore.
- Recuperación de sesión y cierre de sesión.

**Catálogo**
- Exploración de productos disponibles.
- Búsqueda de productos por texto.
- Filtros por categoría, precio y condición.
- Ordenamiento de productos.
- Visualización de detalles, precios, stock y vendedores.

**Favoritos**
- Agregar y eliminar productos favoritos.
- Consultar productos guardados.
- Sincronización de favoritos entre catálogo y detalle.
- Mensaje informativo cuando no existen favoritos.

**Pedidos**
- Consultar el historial de pedidos del comprador.
- Visualizar estados y montos.
- Revisar productos y seguimiento de cada pedido.
- Consultar transacciones asociadas.
- Mostrar un estado vacío cuando no existen pedidos.

**Perfil**
- Consultar los datos personales del usuario.
- Editar nombre, carrera, campus y teléfono.
- Validar campos obligatorios.
- Conservar los cambios después de cerrar sesión.

**Manejo de errores**
- Mensajes ante problemas de conexión con la API.
- Recuperación de información al restablecer la conexión.
- Estados vacíos para búsquedas, favoritos y pedidos.


### 6. Endpoints utilizados

La aplicación móvil se comunica con la API REST de NestJS.

URL base utilizada en las pruebas:

`http://127.0.0.1:3000/api`

Esta dirección funciona en el emulador mediante la redirección ADB descrita anteriormente.

| Método | Endpoint | Función |
|---|---|---|
| POST | `/auth/login` | Iniciar sesión |
| GET | `/categories` | Obtener categorías |
| GET | `/products` | Consultar y filtrar productos |
| GET | `/products/:id` | Consultar detalle de producto |
| GET | `/favorites` | Obtener favoritos |
| POST | `/favorites/:productId` | Agregar favorito |
| DELETE | `/favorites/:productId` | Eliminar favorito |
| GET | `/orders` | Consultar pedidos del comprador |
| GET | `/orders/:id` | Consultar detalle de pedido |
| GET | `/users/me` | Obtener perfil del usuario |
| PATCH | `/users/me` | Actualizar perfil |

El servicio móvil de pedidos también implementa una llamada
`PATCH /orders/:id/status` para solicitar una cancelación.
Esta función se encuentra en el código, pero no fue validada
como una acción disponible en la interfaz durante las pruebas.

#### Autenticación y seguridad

El inicio de sesión utiliza correo y contraseña.

La API entrega un token de acceso JWT, que se incorpora
en las solicitudes autenticadas mediante:

`Authorization: Bearer <token>`

La sesión se almacena en el dispositivo con Expo SecureStore.

Si el backend responde con un error HTTP 401 ante una
solicitud autenticada, la aplicación cierra la sesión.

El cliente HTTP también contempla errores de conexión
y un tiempo de espera de 15 segundos.


### 7. Capturas de la aplicación

Las siguientes capturas fueron obtenidas durante las pruebas funcionales
realizadas en el emulador Android para el Hito 4.

#### Catálogo y detalle de productos

| Catálogo filtrado | Detalle de producto |
|---|---|
| <img src="docs/capturas/catalogo-filtro-categoria.png" width="230" alt="Catálogo filtrado por categoría"> | <img src="docs/capturas/detalle-producto.png" width="230" alt="Detalle de producto"> |

#### Favoritos

| Estado vacío | Productos favoritos |
|---|---|
| <img src="docs/capturas/favoritos-vacios.png" width="230" alt="Favoritos vacíos"> | <img src="docs/capturas/favoritos-con-productos.png" width="230" alt="Lista de favoritos"> |

#### Pedidos

| Historial de pedidos | Pedido pagado |
|---|---|
| <img src="docs/capturas/mis-pedidos.png" width="230" alt="Historial de pedidos"> | <img src="docs/capturas/detalle-pedido-pagado.png" width="230" alt="Detalle de pedido pagado"> |

| Pedido pendiente | Estado sin compras |
|---|---|
| <img src="docs/capturas/detalle-pedido-pendiente.png" width="230" alt="Detalle de pedido pendiente"> | <img src="docs/capturas/pedidos-vacios.png" width="230" alt="Pedidos vacíos"> |

#### Perfil y manejo de errores

| Perfil actualizado | API desconectada |
|---|---|
| <img src="docs/capturas/perfil-editado.png" width="230" alt="Perfil actualizado"> | <img src="docs/capturas/api-desconectada.png" width="230" alt="Mensaje de error de conexión"> |

### 8. Uso de inteligencia artificial

#### Declaración personal - Tareas M03, M14 y M15

Durante el desarrollo de mis tareas del Hito 4 utilicé ChatGPT como herramienta de apoyo para configurar el entorno de desarrollo, resolver problemas de conectividad entre el emulador Android y el backend, organizar las pruebas funcionales y preparar la documentación técnica.

También utilicé Claude Code como apoyo en la implementación de los datos de demostración del backend. Posteriormente, revisé los cambios y comprobé su funcionamiento mediante Docker, PostgreSQL y el emulador Android.

Las herramientas de IA facilitaron el desarrollo y la resolución de problemas, mientras que las verificaciones, pruebas y decisiones de integración se realizaron bajo mi supervisión.

Esta declaración corresponde únicamente a mi participación en el proyecto. Cada integrante debe documentar su propio uso de herramientas de inteligencia artificial.

### 9. Registro detallado de uso de IA

Este registro corresponde a mi participación en las tareas M03, M14 y M15.

Los ejemplos de prompts se presentan resumidos y no como transcripciones literales.

#### ChatGPT

**Propósito:** Apoyar la configuración del entorno, resolver problemas técnicos, organizar pruebas y elaborar la documentación.

**Prompts utilizados:** Las consultas abordaron cómo conectar el emulador Android con una API NestJS ejecutada en Docker, solucionar errores de conexión, verificar datos de demostración, realizar pruebas funcionales y documentar los procedimientos en el README.

**Resultados:** Se consiguió establecer la comunicación entre Expo y el backend, ejecutar pruebas en Android, comprobar pedidos y favoritos, registrar los resultados QA y documentar la instalación y las funcionalidades móviles.

**Validación:** Ejecuté los comandos en PowerShell, revisé los resultados de Docker y PostgreSQL y comprobé personalmente las funcionalidades mediante el emulador Android.

**Aprendizaje:** Comprendí mejor la comunicación entre Android y una API local, el uso de ADB, la importancia de las pruebas de conectividad y la necesidad de verificar las respuestas generadas por IA antes de aplicarlas.

#### Claude Code

**Propósito:** Apoyar la implementación de datos de demostración para facilitar las pruebas del módulo de pedidos y favoritos.

**Prompts utilizados:** Las instrucciones solicitaron incorporar pedidos y favoritos al seed existente, conservar los datos originales, evitar duplicaciones y mantener la compatibilidad con el backend.

**Resultados:** Se incorporaron dos pedidos de demostración, uno pagado y otro pendiente, junto con favoritos de prueba.

**Validación:** Revisé las modificaciones del archivo seed.ts, comprobé la compilación del backend, ejecuté el seed en Docker, consulté PostgreSQL y verifiqué los pedidos en Android. También reinicié el backend para comprobar que no se duplicaran los datos.

**Aprendizaje:** Reforcé la importancia de revisar los cambios generados por IA, trabajar en ramas independientes, comprobar la integridad de los datos y realizar pruebas antes de crear un commit.

#### Responsabilidad y supervisión

La inteligencia artificial se utilizó como herramienta de apoyo. Los cambios fueron revisados mediante pruebas reales antes de incorporarlos al repositorio.

Cada integrante del equipo debe presentar su propia declaración según las herramientas y procedimientos que utilizó.

### 10. Declaraciones individuales de IA del equipo

Las siguientes declaraciones corresponden a borradores elaborados según las responsabilidades de cada integrante. Cada estudiante deberá confirmar las herramientas utilizadas, las consultas realizadas y los resultados obtenidos antes de su entrega definitiva.

#### Javier Leiva — Inicio de sesión y perfil

**Herramienta utilizada:** Pendiente de confirmar.

**Propósito:** Apoyar la comprensión de errores de programación y la revisión de las funcionalidades relacionadas con la autenticación y la gestión del perfil de usuario.

**Prompts de referencia:** Consultas sobre validación de credenciales, autenticación JWT, manejo de respuestas del backend y actualización de información personal.

**Resultados:** Pendiente de confirmar las recomendaciones utilizadas y los cambios implementados con apoyo de IA.

**Validación:** Pendiente de especificar las pruebas realizadas sobre el inicio de sesión y el perfil.

**Aprendizaje:** Pendiente de confirmar los conocimientos adquiridos durante el desarrollo.

#### Damián Acevedo — Catálogo y pedidos

**Herramienta utilizada:** Pendiente de confirmar.

**Propósito:** Apoyar la revisión de la estructura de componentes, la interpretación de errores técnicos y el desarrollo de las funcionalidades del catálogo y los pedidos.

**Prompts de referencia:** Consultas sobre consumo de API REST, búsqueda y filtrado de productos, visualización de pedidos y manejo de estados de carga y error.

**Resultados:** Pendiente de confirmar las soluciones propuestas por IA que fueron utilizadas en el proyecto.

**Validación:** Pendiente de especificar las pruebas realizadas en el catálogo y el módulo de pedidos.

**Aprendizaje:** Pendiente de confirmar los conocimientos adquiridos durante la implementación.

#### Fernando Arancibia — Productos, favoritos y arquitectura

**Herramienta utilizada:** Pendiente de confirmar.

**Propósito:** Apoyar el análisis de componentes de React Native, la organización de funcionalidades y la documentación de la arquitectura del sistema.

**Prompts de referencia:** Consultas sobre visualización de productos, gestión de favoritos, comunicación entre la aplicación móvil y el backend, y representación de la arquitectura del proyecto.

**Resultados:** Pendiente de confirmar las sugerencias utilizadas para implementar funcionalidades o elaborar documentación.

**Validación:** Pendiente de especificar las verificaciones realizadas sobre productos, favoritos y arquitectura.

**Aprendizaje:** Pendiente de confirmar los conocimientos adquiridos durante el desarrollo.

#### Responsabilidad del equipo

La inteligencia artificial debe utilizarse como herramienta complementaria, manteniendo la revisión y validación humana de las soluciones implementadas. Cada integrante es responsable de confirmar la exactitud de su declaración antes de presentarla como definitiva.