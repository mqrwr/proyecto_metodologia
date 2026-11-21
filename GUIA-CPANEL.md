# Argos en cPanel: base de datos y publicación

Tiempo: unos 15 minutos. Necesitas tu acceso a cPanel.

## 1. Crea la base de datos y su usuario

1. En cPanel, abre **MySQL® Databases** (o **Bases de datos MySQL**).
2. En **Create New Database**, escribe `argos` y da clic en **Create Database**.
   cPanel le pone tu prefijo: queda algo como `miusuario_argos`. **Anota ese nombre completo.**
3. Más abajo, en **MySQL Users → Add New User**:
   - Usuario: `argosapp` (queda `miusuario_argosapp`). **Anótalo.**
   - Contraseña: usa **Password Generator** y **guárdala**.
   - Clic en **Create User**.
4. En **Add User To Database**, elige el usuario y la base que creaste, clic en **Add**.
5. En la pantalla de privilegios marca **ALL PRIVILEGES** y clic en **Make Changes**.

## 2. Crea las tablas

1. En cPanel abre **phpMyAdmin**.
2. A la izquierda, da clic en tu base (`miusuario_argos`).
3. Pestaña **Importar** → **Seleccionar archivo** → elige `database.sql` → **Importar** (abajo).
4. Deben aparecer 4 tablas: `mascotas`, `seguimientos`, `solicitudes`, `usuarios`.
   La tabla `mascotas` ya trae 6 mascotas de ejemplo para que el sitio no se vea vacío.

## 3. Conecta el sitio con la base

Abre `config.php` y cambia estas cuatro líneas con lo que anotaste:

```php
const DB_HOST = 'localhost';              // casi siempre se queda así
const DB_NAME = 'miusuario_argos';        // nombre completo de la base
const DB_USER = 'miusuario_argosapp';     // nombre completo del usuario
const DB_PASS = 'la-contraseña-que-guardaste';
```

## 4. Revisa la versión de PHP

En cPanel abre **MultiPHP Manager** (o **Select PHP Version**) y elige **PHP 8.1 o mayor** para tu dominio.
Si ves la lista de extensiones, confirma que **pdo_mysql** esté marcada.

## 5. Sube los archivos

1. Abre **File Manager** → carpeta **public_html** (o la carpeta de tu dominio).
   Si quieres Argos en un subfolder (ej. `tudominio.com/argos`), crea la carpeta y sube ahí.
2. Sube esto, con la misma estructura:

```
.htaccess          ← archivo oculto: en File Manager activa "Settings → Show Hidden Files"
index.html
api.php
config.php         ← ya con tus datos del paso 3
admin/index.html
assets/            ← css, js (site.js, motion.js, admin.js) e img completas
uploads/.htaccess  ← carpeta donde se guardan las fotos que subas
```

Tip: comprime todo en un `.zip` en tu compu, súbelo y usa **Extract** en File Manager.

**No subas** `database.sql` ni esta guía (el `.htaccess` los bloquea de todos modos).

3. Da clic derecho en la carpeta `uploads` → **Change Permissions** → `755`.

## 6. Activa HTTPS

En cPanel abre **SSL/TLS Status** y da clic en **Run AutoSSL**. Sin HTTPS el login funciona, pero las contraseñas viajan sin cifrar.

## 7. Crea la cuenta del refugio

1. Entra a `https://tudominio.com/admin/`.
2. La primera vez te pide **crear la cuenta del administrador**. Llénala y ya estás dentro.
3. Desde ese momento nadie más puede registrarse solo: para agregar personal usa **Agregar persona** en el menú del dashboard.

## 8. Prueba que todo guarde

1. En `tudominio.com` abre una mascota y envía una solicitud. Debes ver un folio tipo `ARG-3FA91C`.
2. En el dashboard → **Solicitudes**, ábrela y cámbiala a **Aprobada**.
3. En **Seguimiento** registra un reporte con foto.
4. En el sitio, sección **Mi solicitud**, escribe el folio y el correo: verás el estado y podrás mandar un reporte como adoptante.
5. En phpMyAdmin verás los registros en las tablas `solicitudes` y `seguimientos`.

Cuando subas las mascotas reales, borra las de ejemplo desde **Mascotas → Editar → Borrar mascota**.

## Si algo falla

| Mensaje | Qué revisar |
|---|---|
| "No pudimos conectar con la base de datos" | Nombre de base, usuario o contraseña en `config.php`. Que el usuario esté agregado a la base con ALL PRIVILEGES. |
| "El servidor no respondió. ¿Está subido api.php?" | Que `api.php` esté en la misma carpeta que `index.html`, y que PHP sea 8.1 o mayor. |
| Error 500 | cPanel → **Errors** (o `error_log` en la carpeta) te dice la línea. Casi siempre es la versión de PHP. |
| No se suben fotos | Permisos `755` en `uploads/`. Fotos JPG, PNG o WEBP de máximo 5 MB. |
| Olvidé la contraseña del admin | En phpMyAdmin, tabla `usuarios`, borra tu fila. Al abrir `/admin` te pedirá crear la cuenta otra vez (solo si la tabla queda vacía). |

## Cómo está armada la base

- **mascotas**: ficha de cada animal y su estado (`disponible`, `en_proceso`, `adoptado`).
- **solicitudes**: datos del interesado, folio y estado (`pendiente`, `en_revision`, `aprobada`, `rechazada`). Una solicitud aprobada es una adopción.
- **seguimientos**: reportes después de la adopción, del refugio o del adoptante, con salud y foto.
- **usuarios**: personal del refugio que entra al dashboard (contraseñas cifradas con bcrypt).

El estado de la mascota se actualiza solo: si recibe una solicitud pasa a "con solicitudes", si se aprueba pasa a "adoptado", y si todas se rechazan vuelve a "disponible".
