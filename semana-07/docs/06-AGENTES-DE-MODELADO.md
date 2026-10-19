# Agentes: de las especificaciones a PostgreSQL

Se incluyen dos agentes de Claude Code en `semana-07/.claude/agents/`, junto
al código de este ejemplo. Son instrucciones para generar y revisar archivos;
no servicios que deban mantenerse ejecutándose con la API.

| Agente | Entrada | Resultado |
|---|---|---|
| `model-to-dbml` | Especificaciones y decisiones del dominio | `model.dbml` y explicación del diseño |
| `dbml-to-postgres` | DBML revisado y carpeta de destino | Configuración pg, migraciones SQL, seed, modelos CRUD, pruebas y documentación |

El diseño se revisa antes de generar la infraestructura. El primer agente no
inicia automáticamente el segundo.

## 1. Abrir Claude Code en la carpeta correcta

Abrir **la carpeta `semana-07` como proyecto en VS Code** y utilizar la extensión
de Claude Code. No basta con abrir un archivo de esa carpeta manteniendo la raíz
del repositorio como proyecto activo.

Con la CLI ya instalada, desde la raíz del repositorio:

```text
cd semana-07
claude
```

En Windows PowerShell o Terminal de macOS se utilizan los mismos comandos.
Las definiciones incluidas son:

- [model-to-dbml](../.claude/agents/model-to-dbml.md).
- [dbml-to-postgres](../.claude/agents/dbml-to-postgres.md).

Si la sesión ya estaba abierta al crear los agentes, iniciar una nueva sesión
de Claude Code. Pedir explícitamente el agente por su nombre. No hace falta
copiar el texto de la definición en cada petición.

Si informa de que no existe, comprobar la carpeta abierta y la presencia de
`.claude/agents/` dentro de `semana-07`. Una sesión iniciada desde la raíz del
repositorio no tiene por qué descubrir agentes de una subcarpeta. No confundirlos con agentes configurados
en otra semana o en el directorio personal.

## 2. Generar DBML a partir de requisitos

Ejemplo de petición, con destino separado del ejemplo de clase:

```text
Usa el agente model-to-dbml para diseñar una biblioteca.

- Una editorial tiene nombre único y muchos libros.
- Cada libro tiene título, ISBN único, fecha de publicación opcional
  y pertenece obligatoriamente a una editorial.
- Un autor tiene nombre y puede escribir muchos libros.
- Un libro puede tener varios autores: usar una tabla intermedia.
- Las entidades principales tienen un id entero autogenerado.
- No permitir duplicar la asociación libro/autor.
- No borrar editoriales o autores que sigan relacionados con libros.
- Al borrar un libro, borrar sus asociaciones, no sus autores.
- Los nombres y títulos no pueden estar vacíos.

Guarda model.dbml y MODELADO.md en generated/biblioteca/db/design/.
Documenta cualquier supuesto. No generes todavía SQL ni código de aplicación.
```

Revisar entidades, obligatoriedad, cardinalidades, claves y reglas de borrado.
Abrir el DBML generado, copiarlo y pegarlo en dbdiagram para visualizarlo.
Comprobar que las notas que describen una regla no se confundan con restricciones
SQL efectivas.

## 3. Generar PostgreSQL y el modelo CRUD

Después de revisar el diseño:

```text
Usa el agente dbml-to-postgres con
generated/biblioteca/db/design/model.dbml y su MODELADO.md.

Genera la implementación en generated/biblioteca/.
Toma el proyecto actual como referencia de estructura y comentarios.
No modifiques su src/, db/ ni sus archivos de configuración.
Usa pg y migraciones SQL; no añadas Knex ni un ORM.
Incluye configuración, creación de base, seed ficticio repetible, modelos CRUD,
pruebas y guía de arranque Windows/macOS.
En la tabla libro/autor gestiona la clave compuesta explícitamente.
Los CRUD deben poder demostrarse desde un script Node; no necesito API HTTP.
No apliques nada a mi base existente ni crees un .env con credenciales reales.
```

Los nombres de los comandos deben consultarse en el README generado: no asumir
que siempre son idénticos a los del ejemplo de tareas. La implementación debe
indicar qué variables completar y cómo comprobar cada nivel de conexión.

Todas las rutas de los prompts son relativas a `semana-07`. Por ejemplo,
`generated/biblioteca/` se creará en `semana-07/generated/biblioteca/`.

## 4. Usar un DBML exportado de otra herramienta

Guardar el archivo dentro del proyecto y proporcionar su ruta al segundo agente:

```text
Usa dbml-to-postgres con db/design/mi-modelo.dbml.
Genera un proyecto independiente en generated/mi-modelo/.
Valida tipos y relaciones, genera migraciones SQL y seed, y documenta el CRUD.
No modifiques los proyectos de semanas anteriores.
```

El archivo debe ser DBML, no una imagen del diagrama ni un archivo SQL renombrado.
Si se aporta solo texto con requisitos, comenzar por `model-to-dbml`.

## 5. Revisar el resultado y hacerlo crecer

Comprobar que el agente entrega rutas y comandos concretos, que el seed respeta
las relaciones y que los CRUD utilizan consultas parametrizadas. Revisar qué
pruebas ha ejecutado y qué sigue pendiente; disponer del código no demuestra
que la base esté creada o el servicio esté en marcha.

Para ampliar el diseño, pedir primero el cambio de DBML y revisar su impacto.
Después solicitar una migración nueva, adaptación del modelo, seed y pruebas.
Indicar si ya existen datos: no regenerar las migraciones iniciales ni resetear
la base para añadir una columna.

Una PK compuesta requiere tratar todas sus columnas al buscar, actualizar y
eliminar. Un modelo con datos sensibles necesita una selección pública de campos,
no un `SELECT *` expuesto directamente. Estos puntos forman parte de las
instrucciones de los agentes.

## Configuración y límites

Los agentes heredan el modelo de Claude de la sesión y sus permisos normales.
No incluyen claves API ni activan un modo que omita permisos. Sus instrucciones
limitan el alcance, pero no sustituyen el control de permisos de Claude Code.

Referencia: [agentes personalizados de Claude Code](https://code.claude.com/docs/en/sub-agents)
y [sintaxis oficial DBML](https://dbml.dbdiagram.io/docs/).

## Comprobaciones realizadas

Se validaron el frontmatter, los nombres y los enlaces de las definiciones.
También se invocaron ambos agentes con Claude Code 2.1.251 en pruebas sin
herramientas ni escritura: el primero devolvió un modelo editorial/libro y el
segundo propuso el alcance y archivos de una implementación autor/libro.
Esto comprueba su descubrimiento y respuesta inicial; no equivale a ejecutar
una infraestructura completa generada por ellos. Cada proyecto generado debe
pasar sus comprobaciones de DBML, migraciones, seed y CRUD.
