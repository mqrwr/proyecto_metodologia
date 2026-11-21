# ARGOS — instalación y validación

Referencia: repositorio https://github.com/mqrwr/proyecto_metodologia, commit `4a2f4f74ea30919e9797eb6d7946cf3b58675b4f`, revisado el 20 de noviembre de 2026.

Esta guía se deriva del código. El procedimiento completo está pendiente de ejecución por el equipo en un entorno de prueba. No incluye credenciales ni modifica la aplicación.

## Arquitectura

Navegador → `index.html`/`admin/index.html` y JavaScript → `api.php?action=...` → PDO → MySQL/MariaDB. Las fotos se guardan en `uploads/`; la base almacena rutas.

- `assets/js/site.js`: catálogo, filtro por especie, ficha, envío de solicitud, consulta por folio y seguimiento del adoptante.
- `assets/js/admin.js`: acceso del personal, resumen, mascotas, solicitudes, adopciones y seguimiento.
- `assets/js/motion.js`: animación. La página pública carga GSAP/ScrollTrigger 3.12.5 mediante CDN.
- `database.sql`: cuatro tablas InnoDB, restricciones y mascotas de ejemplo.
- `config.example.php`: plantilla de conexión, zona horaria y límite de foto de 5 MB.
- `.htaccess`: protección de archivos de configuración y SQL; el de uploads restringe archivos ejecutables. Requiere que Apache respete estas reglas.

## Requisitos por confirmar en el servidor

PHP 8.1 o posterior, inferido por el tipo de retorno `never`, con PDO MySQL, mbstring, sesiones y procesamiento de imágenes mediante getimagesize; MySQL o MariaDB compatible con el SQL; Apache con autorización para aplicar `.htaccess`; directorio uploads escribible por el proceso web. Registrar las versiones reales antes de entregar.

## Preparación de una instalación independiente

1. Descargar o clonar el repositorio en un directorio de prueba y seleccionar el commit de referencia. Evitar trabajar sobre la carpeta del sitio publicado.
2. Crear una base de datos vacía y una cuenta de base de datos limitada a esa base.
3. Importar `database.sql` una sola vez en la base de prueba. El archivo no crea la base y sus INSERT de ejemplo pueden duplicarse al repetir la importación.
4. Copiar `config.example.php` como `config.php` dentro de la instalación de prueba. Completar DB_HOST, DB_NAME, DB_USER y DB_PASS con valores del entorno. No subir ese archivo a Git; está excluido por `.gitignore`.
5. Servir la carpeta con Apache/PHP y confirmar permisos de escritura en uploads. Usar HTTPS en el despliegue. No usar la simple apertura de index.html como prueba de integración.
6. Antes de exponer una instalación nueva, abrir `/admin/` y completar personalmente la creación de la primera cuenta del refugio. El endpoint permite el alta inicial mientras usuarios está vacío. La persona responsable conserva la contraseña fuera del reporte.
7. Abrir el catálogo y confirmar que no aparece el aviso de vista previa. Un fallo de API activa mascotas de demostración y bloquea las solicitudes; las tarjetas por sí solas no prueban conexión a MySQL.
8. Ejecutar la matriz con datos ficticios y registrar fecha, versión, entrada, resultado esperado, resultado real, evidencia y estado.

## Recorrido mínimo que debe quedar demostrado

Crear una mascota de prueba → enviar solicitud → consultar folio/correo → ingresar al refugio → revisar y aprobar/rechazar → consultar el estado actualizado → guardar seguimiento con foto → recargar y comprobar persistencia.

Probar también campos vacíos, correo inválido, credenciales incorrectas, acceso sin sesión, archivo no admitido, exceso de tamaño y fallos de servicio. La baja solo se prueba en la instalación independiente: `borrar_mascota` elimina definitivamente la mascota, sus solicitudes y sus seguimientos. No existe baja lógica en el commit revisado.

## API documentada desde el código

| Grupo | Acciones | Acceso |
|---|---|---|
| Catálogo | mascotas | Público |
| Solicitudes | solicitar, estado | POST público; estado exige folio/correo |
| Seguimiento adoptante | reportar | POST, folio/correo y solicitud aprobada |
| Sesión | sesion, registro, login, logout | Reglas de sesión y alta inicial |
| Resumen | resumen | Sesión de refugio |
| Mascotas | admin_mascotas, guardar_mascota, borrar_mascota | Sesión; escrituras POST y X-Argos |
| Solicitudes privadas | admin_solicitudes, actualizar_solicitud | Sesión; actualización POST y X-Argos |
| Adopciones | adopciones, seguimientos, agregar_seguimiento | Sesión; alta POST y X-Argos |

## Diferencias que requieren decisión o corrección por el equipo

1. AR-11: no hay cuentas de adoptante; la consulta usa folio y correo.
2. AR-13: filtro por especie; no se implementan filtros por edad o tamaño.
3. AR-16: borrado físico en cascada en vez de baja lógica con historial.
4. Historial público: muestra comentarios, salud y fechas, pero no representa las fotos anteriores; el panel del refugio sí las muestra.
5. Revisar concurrencia y fallos entre las escrituras de solicitud y actualización de mascota: no hay transacción explícita que agrupe ambas operaciones.

## Evidencia y colaboración

Conservar los resultados reales de pruebas y el commit que se grabará en el video. Incorporar esta guía y el DER mediante un cambio de documentación separado, con revisión de otro integrante. Las ramas, PR y aprobaciones deben reflejar trabajo real; no atribuir al desarrollo anterior una revisión realizada al cierre.

Antes de actualizar el reporte por cambios de compañeros, comparar el nuevo commit con esta referencia e identificar qué pantallas, operaciones o pruebas deben repetirse.
