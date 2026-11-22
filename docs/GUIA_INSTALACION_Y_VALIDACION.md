# Instalación y pruebas de ARGOS

Guía preparada con la versión `4a2f4f7` del repositorio, revisada el 20 de noviembre de 2026.

Estos pasos se prepararon a partir del código. Todavía falta probar la instalación completa y anotar las versiones del servidor que usa el equipo.

## Cómo está organizado

Navegador → `index.html`/`admin/index.html` y JavaScript → `api.php?action=...` → PDO → MySQL/MariaDB. Las fotos se guardan en `uploads/`; la base almacena rutas.

- `assets/js/site.js`: catálogo, filtro por especie, ficha, envío de solicitud, consulta por folio y seguimiento del adoptante.
- `assets/js/admin.js`: acceso del personal, resumen, mascotas, solicitudes, adopciones y seguimiento.
- `assets/js/motion.js`: animación. La página pública carga GSAP/ScrollTrigger 3.12.5 mediante CDN.
- `database.sql`: cuatro tablas InnoDB, restricciones y mascotas de ejemplo.
- `config.example.php`: plantilla de conexión, zona horaria y límite de foto de 5 MB.
- `.htaccess`: protección de archivos de configuración y SQL; el de uploads restringe archivos ejecutables. Requiere que Apache respete estas reglas.

## Qué necesita el servidor

- PHP 8.1 o posterior: el código utiliza el tipo de retorno `never`.
- PDO MySQL, mbstring y sesiones de PHP. Las imágenes se revisan con `getimagesize`.
- MySQL o MariaDB compatible con `database.sql`.
- Apache configurado para aplicar las reglas de `.htaccess`.
- Permiso de escritura en `uploads/` para el servidor web.

Falta confirmar las versiones instaladas en el servidor publicado.

## Instalación para pruebas

1. Descargar o clonar el repositorio en un directorio de prueba y seleccionar el commit de referencia. Evitar trabajar sobre la carpeta del sitio publicado.
2. Crear una base de datos vacía y una cuenta de base de datos limitada a esa base.
3. Importar `database.sql` una sola vez en la base de prueba. El archivo no crea la base y sus INSERT de ejemplo pueden duplicarse al repetir la importación.
4. Copiar `config.example.php` como `config.php` dentro de la instalación de prueba. Completar DB_HOST, DB_NAME, DB_USER y DB_PASS con valores del entorno. No subir ese archivo a Git; está excluido por `.gitignore`.
5. Servir la carpeta con Apache/PHP y confirmar permisos de escritura en uploads. Usar HTTPS en el despliegue. Abrir `index.html` directamente no ejecuta PHP ni conecta la base de datos.
6. Antes de exponer una instalación nueva, abrir `/admin/` y crear de la primera cuenta del refugio. El endpoint permite el alta inicial mientras usuarios está vacío. Guardar la contraseña fuera del reporte.
7. Abrir el catálogo y confirmar que no aparece el aviso de vista previa. Un fallo de API activa mascotas de demostración y bloquea las solicitudes; ver las tarjetas no basta para confirmar la conexión a MySQL.
8. Ejecutar la matriz con datos ficticios y registrar fecha, versión, entrada, resultado esperado, resultado real, evidencia y estado.

## Recorrido de prueba

Crear una mascota de prueba → enviar solicitud → consultar folio/correo → ingresar al refugio → revisar y aprobar/rechazar → consultar el estado actualizado → guardar seguimiento con foto → recargar y comprobar persistencia.

Probar también campos vacíos, correo inválido, credenciales incorrectas, acceso sin sesión, archivo no admitido, exceso de tamaño y fallos de servicio.

## Operaciones de la API

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

## Puntos por acordar

1. AR-11: no hay cuentas de adoptante; la consulta usa folio y correo.
2. AR-13: filtro por especie; no se implementan filtros por edad o tamaño.
3. Historial público: muestra comentarios, salud y fechas, pero no representa las fotos anteriores; el panel del refugio sí las muestra.
4. Revisar concurrencia y fallos entre las escrituras de solicitud y actualización de mascota: no hay transacción explícita que agrupe ambas operaciones.

## Registro de resultados

Anotar los resultados en [MATRIZ_VALIDACION.csv](MATRIZ_VALIDACION.csv), junto con la versión probada y las capturas. Si cambia el código, revisar qué pruebas deben repetirse antes de grabar el video.
