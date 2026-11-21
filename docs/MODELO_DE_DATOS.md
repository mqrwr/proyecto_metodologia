# Modelo de datos de ARGOS

Derivado de `database.sql` en el commit `4a2f4f74ea30919e9797eb6d7946cf3b58675b4f`. Se muestran campos principales y relaciones físicas. El diagrama no representa una base de producción inspeccionada.

```mermaid
erDiagram
    mascotas ||--o{ solicitudes : recibe
    solicitudes ||--o{ seguimientos : conserva
    usuarios {
        INT id PK
        VARCHAR nombre
        VARCHAR email UK
        VARCHAR password_hash
        DATETIME creado
    }
    mascotas {
        INT id PK
        VARCHAR nombre
        ENUM especie
        ENUM sexo
        SMALLINT edad_meses
        ENUM tamano
        TEXT descripcion
        VARCHAR foto
        ENUM estado
        DATETIME creado
    }
    solicitudes {
        INT id PK
        VARCHAR folio UK
        INT mascota_id FK
        VARCHAR nombre
        VARCHAR email
        VARCHAR telefono
        VARCHAR ciudad
        ENUM vivienda
        TEXT motivo
        ENUM estado
        TEXT notas
        DATETIME creado
        DATETIME actualizado
    }
    seguimientos {
        INT id PK
        INT solicitud_id FK
        ENUM autor
        ENUM salud
        TEXT comentario
        VARCHAR foto
        DATETIME creado
    }
```

Las cuatro tablas usan InnoDB y utf8mb4. Cada solicitud tiene una mascota y cada seguimiento pertenece a una solicitud. `usuarios` contiene las cuentas del refugio y no tiene claves foráneas hacia las otras tablas ni columna de rol. Los datos del adoptante se almacenan en la solicitud; una adopción es una solicitud con estado `aprobada`.

Ambas claves foráneas declaran `ON DELETE CASCADE`. Por ello, `borrar_mascota` elimina físicamente la mascota y sus solicitudes y seguimientos. Esto difiere de la baja lógica prevista en AR-16 y requiere decisión o corrección del equipo. No se ejecutó una eliminación para realizar esta revisión.

Las fotos se conservan como archivos; la base almacena sus rutas. La revisión del SQL no acredita por sí sola integridad en ejecución ni conservación de archivos tras un borrado.
