# Estado de la entrega de Canvas

Fuente de requisitos: [entrega final](https://cursos.tecmilenio.mx/courses/246820/assignments/4480541). Fecha de entrega observada: 23 de noviembre de 2026 a las 23:59.

| Criterio | Evidencia disponible | Pendiente |
|---|---|---|
| Prototipo y lógica | Sitio y repositorio público; operaciones revisadas en código | Recorrido integral probado y versión desplegada confirmada |
| UI/UX | Capturas del catálogo, ficha, folio y acceso | Panel, aprobación y seguimiento con datos de prueba; prueba móvil/teclado |
| Datos | Esquema SQL, DER, explicación CRUD | Evidencia de persistencia e integridad antes/después |
| Pruebas | Matriz y tres comprobaciones de sintaxis JS con salida 0 | Ejecución funcional, incidencias y repetición tras correcciones |
| Reporte técnico y evidencia ágil | Arquitectura, guía, corte Jira, Project y documentación en rama | Revisión real del PR, retrospectiva y video de 3–5 minutos |

## Tablero y métricas

El [Project](https://github.com/users/Maj0606/projects/1) se creó al cierre y contiene 45 tarjetas del corte revisado de Jira: 7 épicas, 17 historias y 21 tareas. Sus estados son 25 Todo, 5 In Progress y 15 Done. Se trasladaron claves, títulos y estados, sin reconstruir un historial anterior en GitHub.

Seis de las 17 historias figuran Listo: **35.3 %**. Este indicador describe Jira, no el porcentaje de software validado. WIP observado: cinco elementos En curso. No se declara un límite WIP acordado ni un burndown histórico.

El Project pertenece a Maj0606 y el repo a mqrwr. Se añadió su enlace al README y se configuró el repo como predeterminado del Project. La pestaña Projects del repo todavía no lo lista. GitHub limita el listado manual a proyectos del mismo propietario: [documentación oficial](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/adding-your-project-to-a-repository).

Para que figure en esa pestaña, mqrwr debe copiar el tablero a su cuenta, incluir sus tarjetas y vincular esa copia. Después se deben comprobar los 45 elementos y actualizar los enlaces del reporte. No se debe cambiar la propiedad del repositorio para resolverlo.

## Acuerdos y comprobaciones pendientes

- AR-11: cuenta de adoptante prevista frente a consulta por folio/correo implementada.
- AR-13: filtros previstos por especie, edad y tamaño frente a filtro solo por especie.
- AR-16: baja lógica prevista frente a borrado definitivo en cascada.
- Definir si el historial público debe mostrar fotos anteriores; actualmente muestra comentarios, salud y fechas, mientras el panel del refugio sí muestra fotos.
- Probar concurrencia y fallos entre las escrituras relacionadas; no hay transacción explícita que agrupe solicitud y sincronización de mascota.
- Ejecutar la matriz con datos de ensayo. Solo se dispone del sitio publicado y no se realizaron operaciones destructivas.
- Registrar retrospectiva, contribuciones y aceptación reales del equipo.
- Incorporar el video y su enlace de acceso. El guion no sustituye la grabación.

## Revisión de la documentación

Otro integrante debe contrastar la guía y el DER con el código, revisar las diferencias de alcance, verificar enlaces y registrar su revisión del PR. La aprobación no se da por hecha. Una rama y PR de documentación realizados al cierre acreditan esa colaboración; no sustituyen evidencia de ramas de funcionalidades anteriores.
