# M14 - Informe de pruebas QA en Android

Fecha: 24 de noviembre de 2026
Proyecto: Marketplace UNAB Movil
Entorno: Android Emulator, Expo, NestJS y Docker.

## Objetivo

Verificar el funcionamiento de la aplicacion movil,
la conectividad con la API, los estados vacios
y los principales flujos del usuario.

## Resultados de las pruebas

| Area | Prueba | Resultado |
|---|---|---|
| Autenticacion | Inicio y cierre de sesion | Aprobado |
| Autenticacion | Correo invalido | Aprobado |
| Autenticacion | Contrasena incorrecta | Aprobado |
| Autenticacion | Mostrar y ocultar contrasena | Aprobado |
| Conectividad | Backend detenido | Aprobado |
| Conectividad | Recuperacion de la API | Aprobado |
| Conectividad | Modo avion sin acceso a la API | Aprobado |
| Catalogo | Busqueda sin resultados | Aprobado |
| Catalogo | Limpiar busqueda | Aprobado |
| Catalogo | Filtro por categoria | Aprobado |
| Catalogo | Rango de precios | Aprobado |
| Catalogo | Condicion nuevo y usado | Aprobado |
| Catalogo | Ordenamiento por precio | Aprobado |
| Productos | Visualizacion del detalle | Aprobado |
| Favoritos | Estado vacio | Aprobado |
| Favoritos | Agregar y quitar | Aprobado |
| Favoritos | Sincronizacion con detalle | Aprobado |
| Pedidos | Estado vacio | Aprobado |
| Pedidos | Lista de pedidos de demostracion | Aprobado |
| Pedidos | Detalle pagado y pendiente | Aprobado |
| Pedidos | Visualizacion de transacciones | Aprobado |
| Perfil | Visualizacion de datos | Aprobado |
| Perfil | Edicion y guardado | Aprobado |
| Perfil | Persistencia entre sesiones | Aprobado |
| Perfil | Cancelar cambios | Aprobado |
| Perfil | Validacion de nombre obligatorio | Aprobado |

## Observaciones de mejora

1. Al detener la API, Mis pedidos conserva la lista
   anterior junto al mensaje de error. Se recomienda
   indicar que los datos pueden estar desactualizados.

2. El estado vacio de Mis pedidos tiene bastante
   espacio superior. Se puede revisar su alineacion.

3. Algunos productos no tienen imagen. El marcador
   de posicion funciona correctamente.

## Conclusion

Las pruebas ejecutadas no detectaron errores
funcionales bloqueantes.

La aplicacion respondio correctamente ante
la perdida y recuperacion de conexion, y los
principales flujos funcionaron en el emulador.

Las observaciones identificadas corresponden
a mejoras de experiencia de usuario.

No se modifico codigo de la aplicacion
durante estas pruebas.
