<?php
// ARGOS · API única. El sitio público y el dashboard hablan con este archivo.
declare(strict_types=1);

require __DIR__ . '/config.php';

$https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_name('argos');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// ---------- utilidades ----------

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = defined('DB_DSN') ? DB_DSN : 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

function out(mixed $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $msg, int $code = 400, array $campos = []): never
{
    out(['error' => $msg, 'campos' => $campos], $code);
}

function now(): string
{
    return date('Y-m-d H:i:s');
}

function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

/** Datos del formulario: JSON o multipart. */
function input(): array
{
    static $data = null;
    if ($data === null) {
        $ct = $_SERVER['CONTENT_TYPE'] ?? '';
        $data = str_contains($ct, 'application/json')
            ? (json_decode(file_get_contents('php://input') ?: '[]', true) ?: [])
            : $_POST;
    }
    return $data;
}

function txt(string $k, int $max = 255): string
{
    return mb_substr(trim((string)(input()[$k] ?? '')), 0, $max);
}

function one_of(string $k, array $ok, string $default): string
{
    $v = txt($k);
    return in_array($v, $ok, true) ? $v : $default;
}

function flag(string $k): int
{
    $v = input()[$k] ?? 0;
    return ($v === true || $v === '1' || $v === 1 || $v === 'on' || $v === 'true') ? 1 : 0;
}

function require_post(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Método no permitido', 405);
}

/** Solo personal con sesión. Las escrituras exigen la cabecera X-Argos (protección CSRF). */
function admin(): array
{
    if (empty($_SESSION['uid'])) fail('Inicia sesión', 401);
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_SERVER['HTTP_X_ARGOS'] ?? '') !== '1') fail('Petición no válida', 403);
    return ['id' => $_SESSION['uid'], 'nombre' => $_SESSION['nombre']];
}

/** Guarda una foto subida y devuelve su ruta relativa, o '' si no se subió nada. */
function upload(string $campo): string
{
    $f = $_FILES[$campo] ?? null;
    if (!$f || $f['error'] === UPLOAD_ERR_NO_FILE) return '';
    if ($f['error'] !== UPLOAD_ERR_OK) fail('No se pudo subir la foto', 400, [$campo => 'Error al subir']);
    if ($f['size'] > MAX_FOTO_MB * 1024 * 1024) fail('Foto muy pesada', 400, [$campo => 'Máximo ' . MAX_FOTO_MB . ' MB']);
    $info = @getimagesize($f['tmp_name']);
    $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$info['mime'] ?? ''] ?? null;
    if (!$ext) fail('Formato no válido', 400, [$campo => 'Usa JPG, PNG o WEBP']);
    $nombre = 'uploads/' . bin2hex(random_bytes(10)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], __DIR__ . '/' . $nombre)) fail('No se pudo guardar la foto', 500);
    return $nombre;
}

/** El estado de la mascota sigue a sus solicitudes. */
function sync_mascota(int $mascotaId): void
{
    $estados = q('SELECT estado FROM solicitudes WHERE mascota_id = ?', [$mascotaId])->fetchAll(PDO::FETCH_COLUMN);
    $nuevo = in_array('aprobada', $estados, true) ? 'adoptado'
        : (in_array('en_revision', $estados, true) || in_array('pendiente', $estados, true) ? 'en_proceso' : 'disponible');
    q('UPDATE mascotas SET estado = ? WHERE id = ?', [$nuevo, $mascotaId]);
}

function solicitud_publica(): array
{
    $s = q('SELECT s.*, m.nombre AS mascota, m.foto AS mascota_foto FROM solicitudes s JOIN mascotas m ON m.id = s.mascota_id
            WHERE s.folio = ? AND s.email = ?', [strtoupper(txt('folio', 12)), mb_strtolower(txt('email', 150))])->fetch();
    if (!$s) fail('No encontramos una solicitud con ese folio y correo', 404);
    return $s;
}

// ---------- acciones ----------

$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        // ===== Público =====

        case 'mascotas':
            $rows = q("SELECT id, nombre, especie, raza, sexo, edad_meses, tamano, descripcion, foto, vacunado, esterilizado, estado
                       FROM mascotas WHERE estado <> 'adoptado' ORDER BY estado = 'en_proceso', creado DESC")->fetchAll();
            out(['mascotas' => $rows, 'adoptadas' => (int)q("SELECT COUNT(*) FROM mascotas WHERE estado = 'adoptado'")->fetchColumn()]);

        case 'solicitar':
            require_post();
            if (txt('sitio_web') !== '') out(['folio' => 'ARG-000000']); // trampa para bots
            $err = [];
            $mascotaId = (int)(input()['mascota_id'] ?? 0);
            $m = q("SELECT id, estado FROM mascotas WHERE id = ?", [$mascotaId])->fetch();
            if (!$m || $m['estado'] === 'adoptado') $err['mascota_id'] = 'Elige una mascota disponible';
            foreach (['nombre' => 'Escribe tu nombre', 'telefono' => 'Escribe tu teléfono', 'ciudad' => 'Escribe tu ciudad', 'motivo' => 'Cuéntanos por qué quieres adoptar'] as $k => $msg) {
                if (txt($k) === '') $err[$k] = $msg;
            }
            $email = mb_strtolower(txt('email', 150));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $err['email'] = 'Revisa tu correo';
            if (!in_array(txt('vivienda'), ['casa', 'departamento'], true)) $err['vivienda'] = 'Elige tu tipo de vivienda';
            if ($err) fail('Revisa los campos marcados', 422, $err);

            $folio = 'ARG-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
            q('INSERT INTO solicitudes (folio, mascota_id, nombre, email, telefono, ciudad, vivienda, tiene_patio, otras_mascotas, motivo, estado, creado, actualizado)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [
                $folio, $mascotaId, txt('nombre', 120), $email, txt('telefono', 30), txt('ciudad', 100), txt('vivienda'),
                flag('tiene_patio'), txt('otras_mascotas'), txt('motivo', 2000), 'pendiente', now(), now(),
            ]);
            sync_mascota($mascotaId);
            out(['folio' => $folio], 201);

        case 'estado':
            require_post();
            $s = solicitud_publica();
            $segs = q('SELECT autor, salud, comentario, foto, creado FROM seguimientos WHERE solicitud_id = ? ORDER BY creado DESC', [$s['id']])->fetchAll();
            out(['folio' => $s['folio'], 'estado' => $s['estado'], 'mascota' => $s['mascota'], 'mascota_foto' => $s['mascota_foto'],
                 'creado' => $s['creado'], 'actualizado' => $s['actualizado'], 'seguimientos' => $segs]);

        case 'reportar':
            require_post();
            $s = solicitud_publica();
            if ($s['estado'] !== 'aprobada') fail('El seguimiento se abre cuando tu adopción está aprobada', 403);
            if (txt('comentario') === '') fail('Revisa los campos marcados', 422, ['comentario' => 'Cuéntanos cómo está']);
            q('INSERT INTO seguimientos (solicitud_id, autor, salud, comentario, foto, creado) VALUES (?,?,?,?,?,?)',
                [$s['id'], 'adoptante', one_of('salud', ['bien', 'regular', 'atencion'], 'bien'), txt('comentario', 2000), upload('foto'), now()]);
            out(['ok' => true], 201);

        // ===== Sesión =====

        case 'sesion':
            $hay = (int)q('SELECT COUNT(*) FROM usuarios')->fetchColumn() > 0;
            out(['usuario' => empty($_SESSION['uid']) ? null : ['nombre' => $_SESSION['nombre']], 'necesita_registro' => !$hay]);

        case 'registro': // solo funciona mientras no exista ninguna cuenta
            require_post();
            if ((int)q('SELECT COUNT(*) FROM usuarios')->fetchColumn() > 0) {
                if (empty($_SESSION['uid'])) fail('Ya existe una cuenta. Pide a un administrador que te agregue.', 403);
                admin();
            }
            $err = [];
            $email = mb_strtolower(txt('email', 150));
            if (txt('nombre') === '') $err['nombre'] = 'Escribe tu nombre';
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $err['email'] = 'Revisa el correo';
            if (mb_strlen((string)(input()['password'] ?? '')) < 8) $err['password'] = 'Mínimo 8 caracteres';
            if (!$err && q('SELECT 1 FROM usuarios WHERE email = ?', [$email])->fetch()) $err['email'] = 'Ese correo ya tiene cuenta';
            if ($err) fail('Revisa los campos marcados', 422, $err);
            q('INSERT INTO usuarios (nombre, email, password_hash, creado) VALUES (?,?,?,?)',
                [txt('nombre', 100), $email, password_hash((string)input()['password'], PASSWORD_DEFAULT), now()]);
            if (empty($_SESSION['uid'])) {
                session_regenerate_id(true);
                $_SESSION['uid'] = (int)db()->lastInsertId();
                $_SESSION['nombre'] = txt('nombre', 100);
            }
            out(['ok' => true], 201);

        case 'login':
            require_post();
            $u = q('SELECT id, nombre, password_hash FROM usuarios WHERE email = ?', [mb_strtolower(txt('email', 150))])->fetch();
            if (!$u || !password_verify((string)(input()['password'] ?? ''), $u['password_hash'])) {
                usleep(400000);
                fail('Correo o contraseña incorrectos', 401);
            }
            session_regenerate_id(true);
            $_SESSION['uid'] = (int)$u['id'];
            $_SESSION['nombre'] = $u['nombre'];
            out(['usuario' => ['nombre' => $u['nombre']]]);

        case 'logout':
            require_post();
            $_SESSION = [];
            session_destroy();
            out(['ok' => true]);

        // ===== Dashboard =====

        case 'resumen':
            admin();
            $porEstado = fn(string $t) => array_column(q("SELECT estado, COUNT(*) n FROM $t GROUP BY estado")->fetchAll(), 'n', 'estado');
            $mas = $porEstado('mascotas');
            $sol = $porEstado('solicitudes');
            // solicitudes de los últimos 6 meses, agrupadas en PHP para no depender del motor
            $meses = [];
            for ($i = 5; $i >= 0; $i--) $meses[date('Y-m', strtotime("first day of -$i month"))] = 0;
            $desde = array_key_first($meses) . '-01 00:00:00';
            foreach (q('SELECT creado FROM solicitudes WHERE creado >= ?', [$desde])->fetchAll(PDO::FETCH_COLUMN) as $c) {
                $k = substr($c, 0, 7);
                if (isset($meses[$k])) $meses[$k]++;
            }
            $hace30 = date('Y-m-d H:i:s', strtotime('-30 days'));
            out([
                'mascotas' => ['disponible' => (int)($mas['disponible'] ?? 0), 'en_proceso' => (int)($mas['en_proceso'] ?? 0), 'adoptado' => (int)($mas['adoptado'] ?? 0)],
                'solicitudes' => ['pendiente' => (int)($sol['pendiente'] ?? 0), 'en_revision' => (int)($sol['en_revision'] ?? 0), 'aprobada' => (int)($sol['aprobada'] ?? 0), 'rechazada' => (int)($sol['rechazada'] ?? 0)],
                'por_mes' => $meses,
                'seguimientos_30d' => (int)q('SELECT COUNT(*) FROM seguimientos WHERE creado >= ?', [$hace30])->fetchColumn(),
                'sin_seguimiento' => q("SELECT s.id, s.folio, s.nombre, m.nombre AS mascota, s.actualizado,
                                          (SELECT MAX(g.creado) FROM seguimientos g WHERE g.solicitud_id = s.id) AS ultimo
                                        FROM solicitudes s JOIN mascotas m ON m.id = s.mascota_id
                                        WHERE s.estado = 'aprobada'
                                          AND COALESCE((SELECT MAX(g.creado) FROM seguimientos g WHERE g.solicitud_id = s.id), s.actualizado) < ?
                                        ORDER BY s.actualizado LIMIT 6", [$hace30])->fetchAll(),
                'recientes' => q("SELECT s.id, s.folio, s.nombre, s.estado, s.creado, m.nombre AS mascota, m.foto
                                  FROM solicitudes s JOIN mascotas m ON m.id = s.mascota_id ORDER BY s.creado DESC LIMIT 6")->fetchAll(),
            ]);

        case 'admin_mascotas':
            admin();
            out(['mascotas' => q('SELECT m.*, (SELECT COUNT(*) FROM solicitudes s WHERE s.mascota_id = m.id) AS solicitudes
                                  FROM mascotas m ORDER BY m.creado DESC, m.id DESC')->fetchAll()]);

        case 'guardar_mascota':
            require_post();
            admin();
            $id = (int)(input()['id'] ?? 0);
            $err = [];
            if (txt('nombre') === '') $err['nombre'] = 'Escribe el nombre';
            if (txt('descripcion') === '') $err['descripcion'] = 'Escribe una descripción';
            if ($err) fail('Revisa los campos marcados', 422, $err);
            $datos = [
                txt('nombre', 80), one_of('especie', ['perro', 'gato', 'otro'], 'perro'), txt('raza', 80),
                one_of('sexo', ['macho', 'hembra'], 'macho'), max(0, min(400, (int)(input()['edad_meses'] ?? 0))),
                one_of('tamano', ['chico', 'mediano', 'grande'], 'mediano'), txt('descripcion', 2000),
                flag('vacunado'), flag('esterilizado'), one_of('estado', ['disponible', 'en_proceso', 'adoptado'], 'disponible'),
            ];
            $foto = upload('foto');
            if ($id) {
                q('UPDATE mascotas SET nombre=?, especie=?, raza=?, sexo=?, edad_meses=?, tamano=?, descripcion=?, vacunado=?, esterilizado=?, estado=? WHERE id=?', [...$datos, $id]);
                if ($foto) q('UPDATE mascotas SET foto=? WHERE id=?', [$foto, $id]);
            } else {
                q('INSERT INTO mascotas (nombre, especie, raza, sexo, edad_meses, tamano, descripcion, vacunado, esterilizado, estado, foto, creado) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                    [...$datos, $foto, now()]);
                $id = (int)db()->lastInsertId();
            }
            out(['id' => $id]);

        case 'borrar_mascota':
            require_post();
            admin();
            q('DELETE FROM mascotas WHERE id = ?', [(int)(input()['id'] ?? 0)]);
            out(['ok' => true]);

        case 'admin_solicitudes':
            admin();
            out(['solicitudes' => q('SELECT s.*, m.nombre AS mascota, m.foto AS mascota_foto, m.especie
                                     FROM solicitudes s JOIN mascotas m ON m.id = s.mascota_id ORDER BY s.creado DESC')->fetchAll()]);

        case 'actualizar_solicitud':
            require_post();
            admin();
            $id = (int)(input()['id'] ?? 0);
            $s = q('SELECT mascota_id FROM solicitudes WHERE id = ?', [$id])->fetch();
            if (!$s) fail('Solicitud no encontrada', 404);
            $estado = one_of('estado', ['pendiente', 'en_revision', 'aprobada', 'rechazada'], 'pendiente');
            if ($estado === 'aprobada' && q("SELECT 1 FROM solicitudes WHERE mascota_id = ? AND estado = 'aprobada' AND id <> ?", [$s['mascota_id'], $id])->fetch()) {
                fail('Esta mascota ya tiene una adopción aprobada', 409);
            }
            q('UPDATE solicitudes SET estado = ?, notas = ?, actualizado = ? WHERE id = ?', [$estado, txt('notas', 2000), now(), $id]);
            sync_mascota((int)$s['mascota_id']);
            out(['ok' => true]);

        case 'adopciones':
            admin();
            out(['adopciones' => q("SELECT s.id, s.folio, s.nombre, s.email, s.telefono, s.actualizado AS adoptado, m.nombre AS mascota, m.foto,
                                      (SELECT COUNT(*) FROM seguimientos g WHERE g.solicitud_id = s.id) AS total,
                                      (SELECT MAX(g.creado) FROM seguimientos g WHERE g.solicitud_id = s.id) AS ultimo
                                    FROM solicitudes s JOIN mascotas m ON m.id = s.mascota_id
                                    WHERE s.estado = 'aprobada' ORDER BY s.actualizado DESC")->fetchAll()]);

        case 'seguimientos':
            admin();
            out(['seguimientos' => q('SELECT * FROM seguimientos WHERE solicitud_id = ? ORDER BY creado DESC', [(int)($_GET['solicitud'] ?? 0)])->fetchAll()]);

        case 'agregar_seguimiento':
            require_post();
            admin();
            $sid = (int)(input()['solicitud_id'] ?? 0);
            if (!q("SELECT 1 FROM solicitudes WHERE id = ? AND estado = 'aprobada'", [$sid])->fetch()) fail('Adopción no encontrada', 404);
            if (txt('comentario') === '') fail('Revisa los campos marcados', 422, ['comentario' => 'Escribe cómo la encontraste']);
            q('INSERT INTO seguimientos (solicitud_id, autor, salud, comentario, foto, creado) VALUES (?,?,?,?,?,?)',
                [$sid, 'refugio', one_of('salud', ['bien', 'regular', 'atencion'], 'bien'), txt('comentario', 2000), upload('foto'), now()]);
            out(['ok' => true], 201);

        default:
            fail('Acción desconocida', 404);
    }
} catch (PDOException $e) {
    error_log('ARGOS DB: ' . $e->getMessage());
    fail('No pudimos conectar con la base de datos. Revisa config.php.', 500);
}
