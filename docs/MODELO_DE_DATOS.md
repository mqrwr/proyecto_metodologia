# Modelo de datos de ARGOS

El diagrama resume las cuatro tablas de `database.sql` y sus relaciones, según la versión `4a2f4f7`. Todavía falta comparar este esquema con la base del sitio publicado.

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


Las fotos se guardan como archivos y la base almacena sus rutas. Falta comprobar el guardado de datos durante las pruebas del recorrido completo.
