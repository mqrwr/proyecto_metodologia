-- ARGOS · Esquema de base de datos (MySQL / MariaDB)
-- Impórtalo en phpMyAdmin (cPanel) dentro de la base que creaste.
-- No crea la base de datos: en cPanel la creas tú desde "MySQL Databases".

SET NAMES utf8mb4;

-- Personal del refugio que entra al dashboard.
-- La primera cuenta se crea desde /admin la primera vez que lo abres.
CREATE TABLE IF NOT EXISTS usuarios (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  creado         DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mascotas del refugio.
CREATE TABLE IF NOT EXISTS mascotas (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(80)  NOT NULL,
  especie       ENUM('perro','gato','otro') NOT NULL DEFAULT 'perro',
  raza          VARCHAR(80)  NOT NULL DEFAULT '',
  sexo          ENUM('macho','hembra') NOT NULL,
  edad_meses    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  tamano        ENUM('chico','mediano','grande') NOT NULL DEFAULT 'mediano',
  descripcion   TEXT NOT NULL,
  foto          VARCHAR(255) NOT NULL DEFAULT '',
  vacunado      TINYINT(1) NOT NULL DEFAULT 0,
  esterilizado  TINYINT(1) NOT NULL DEFAULT 0,
  estado        ENUM('disponible','en_proceso','adoptado') NOT NULL DEFAULT 'disponible',
  creado        DATETIME NOT NULL,
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Solicitudes de adopción. Una solicitud "aprobada" es una adopción.
CREATE TABLE IF NOT EXISTS solicitudes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  folio           VARCHAR(12)  NOT NULL UNIQUE,
  mascota_id      INT UNSIGNED NOT NULL,
  nombre          VARCHAR(120) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  telefono        VARCHAR(30)  NOT NULL,
  ciudad          VARCHAR(100) NOT NULL,
  vivienda        ENUM('casa','departamento') NOT NULL,
  tiene_patio     TINYINT(1) NOT NULL DEFAULT 0,
  otras_mascotas  VARCHAR(255) NOT NULL DEFAULT '',
  motivo          TEXT NOT NULL,
  estado          ENUM('pendiente','en_revision','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
  notas           TEXT NULL,
  creado          DATETIME NOT NULL,
  actualizado     DATETIME NOT NULL,
  INDEX idx_estado (estado),
  CONSTRAINT fk_sol_mascota FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seguimiento posterior a la adopción (lo registra el refugio o el adoptante).
CREATE TABLE IF NOT EXISTS seguimientos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  solicitud_id   INT UNSIGNED NOT NULL,
  autor          ENUM('refugio','adoptante') NOT NULL,
  salud          ENUM('bien','regular','atencion') NOT NULL DEFAULT 'bien',
  comentario     TEXT NOT NULL,
  foto           VARCHAR(255) NOT NULL DEFAULT '',
  creado         DATETIME NOT NULL,
  INDEX idx_solicitud (solicitud_id),
  CONSTRAINT fk_seg_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mascotas de ejemplo para que el sitio no se vea vacío. Bórralas desde el dashboard cuando subas las reales.
INSERT INTO mascotas (nombre, especie, raza, sexo, edad_meses, tamano, descripcion, foto, vacunado, esterilizado, estado, creado) VALUES
('Luna',   'perro', 'Mestiza de labrador', 'hembra', 4,  'mediano', 'Cachorra curiosa. Aprende rápido y duerme donde haya sol.', 'assets/img/luna.jpg',   1, 0, 'disponible', NOW()),
('Pancho', 'perro', 'Pug',                 'macho',  36, 'chico',   'Tranquilo y friolento. Ideal para departamento.',          'assets/img/pancho.jpg', 1, 1, 'disponible', NOW()),
('Canela', 'perro', 'Dachshund',           'hembra', 24, 'chico',   'Le encanta el pasto y seguir olores. Se lleva bien con perros.', 'assets/img/canela.jpg', 1, 1, 'disponible', NOW()),
('Nieve',  'perro', 'Husky mestizo',       'hembra', 30, 'grande',  'Mucha energía. Busca familia que salga a correr.',         'assets/img/nieve.jpg',  1, 1, 'disponible', NOW()),
('Michi',  'gato',  'Doméstico',           'macho',  18, 'chico',   'Independiente pero pide caricias en la tarde.',             'assets/img/michi.jpg',  1, 1, 'disponible', NOW()),
('Frijol', 'perro', 'Pug',                 'macho',  60, 'chico',   'Adulto mayor, muy cariñoso. Ronca un poco.',                'assets/img/frijol.jpg', 1, 1, 'disponible', NOW()),
('Mango',  'perro', 'Golden retriever mestizo', 'macho', 30, 'grande', 'Sonríe con todo el cuerpo. Le encanta el agua y se lleva bien con niños.', 'assets/img/mango.jpg', 1, 1, 'disponible', NOW()),
('Naranja','gato',  'Doméstica atigrada',  'hembra', 3,  'chico',   'Gatita juguetona. Ya usa arenero y duerme hecha bolita en tu regazo.', 'assets/img/naranja.jpg', 1, 0, 'disponible', NOW()),
('Bruno',  'perro', 'Corgi',               'macho',  5,  'chico',   'Cachorro feliz y glotón. Aprende trucos por un premio.',    'assets/img/bruno.jpg',  1, 0, 'disponible', NOW());
