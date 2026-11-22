# Pendientes para la entrega

Entrega: 23 de noviembre de 2026, a las 23:59. Este resumen reúne lo registrado el 20 de noviembre; falta actualizarlo con las últimas pruebas y acuerdos del equipo.

| Parte | Ya tenemos | Falta completar |
|---|---|---|
| Aplicación | Sitio publicado y código en GitHub | Probar el recorrido completo y confirmar qué versión está publicada |
| Interfaz | Capturas del catálogo, ficha, consulta y acceso | Capturas del panel, aprobación y seguimiento; pruebas en móvil y con teclado |
| Base de datos | Esquema SQL, diagrama y explicación de las operaciones | Comprobar que los cambios se guardan y añadir capturas del antes y después |
| Pruebas | Matriz de casos y revisión de sintaxis de los tres archivos JavaScript | Ejecutar los casos pendientes y registrar errores, correcciones y resultados |
| Reporte y trabajo en equipo | Reporte, guía, respaldo de Jira y tablero | Revisión del PR, retrospectiva y video de 3 a 5 minutos |

## Tablero

El [tablero de GitHub](https://github.com/users/Maj0606/projects/1) contiene las 45 tarjetas copiadas de Jira el 20 de noviembre: 7 épicas, 17 historias y 21 tareas. En esa fecha había 25 por hacer, 5 en curso y 15 listas.

De las 17 historias, 6 estaban listas: **35.3 %**. Es un dato del tablero; las pruebas funcionales se registran por separado en la matriz. El tablero de GitHub se creó para esta entrega y no contiene el historial anterior de Jira.

El enlace ya aparece en el README. Falta que mqrwr copie el tablero a su cuenta y lo vincule para que también aparezca en la pestaña Projects del repo. Después habrá que actualizar los enlaces y comprobar que estén las 45 tarjetas.

## Puntos por revisar con el equipo

- **AR-11:** se propusieron cuentas para adoptantes, pero la consulta actual funciona con folio y correo. Acordar cuál será el alcance final.
- **AR-13:** el catálogo filtra por especie. Confirmar si también se agregarán los filtros de edad y tamaño.
- **Fotos del seguimiento:** el panel muestra fotos anteriores; la consulta pública muestra comentarios, salud y fechas. Definir qué debe ver el adoptante.
- **Guardado de datos:** probar solicitudes simultáneas y fallos entre operaciones. Las escrituras relacionadas no están agrupadas en una transacción.
- **Pruebas completas:** conseguir acceso y datos de prueba para ejecutar la matriz. Hasta ahora solo se revisó la parte pública del sitio y el código.
- **Retrospectiva:** escribir qué funcionó, qué dificultades hubo y qué cambiaríamos en otro proyecto, con las aportaciones del equipo.
- **Video:** grabar el recorrido, revisar la duración y añadir el enlace. Ya está preparado el guion.

## Revisión en GitHub

El [PR #1](https://github.com/mqrwr/proyecto_metodologia/pull/1) sigue abierto. Otro integrante debe revisar la guía, el modelo de datos y los enlaces antes de aprobarlo. También falta reunir las ramas y revisiones que se hayan usado durante el desarrollo; este PR corresponde a la documentación de la entrega.
