# Preparar y recorrer el ejemplo de principio a fin

El objetivo es seguir una petición real: Postman → Express → middleware →
controlador → modelo → PostgreSQL → respuesta. Se usa una única API ya completa.
No es necesario ejecutar las demos de consola para que funcione.

## 1. Preparar el entorno

Arrancar PostgreSQL: Postgres.app en macOS o el servicio PostgreSQL en Windows.
Abrir una terminal en la raíz del repositorio y entrar al ejemplo:

```text
cd semana-08
node --version
npm ci
```

Usar Node 22 o 24. Si PowerShell bloquea npm, escribir npm.cmd en todos los comandos.
La [guía de preparación](01-PREPARACION.md) detalla instalación y diagnóstico.

Copiar la plantilla **una sola vez**, si todavía no existe .env:

```powershell
# Windows PowerShell
Copy-Item .env.template .env
```

```sh
# macOS
cp .env.template .env
```

Editar .env con el usuario y contraseña de PostgreSQL de este equipo:

```text
DATABASE_URL=postgresql://USUARIO:CLAVE@127.0.0.1:5432/aula_web_semana08
JWT_SECRET=PEGAR_AQUI_EL_RESULTADO_DEL_COMANDO_SIGUIENTE
PORT=3000
CORS_ORIGINS=http://localhost:5173
```

Generar el secreto y copiar el resultado en JWT_SECRET:

```text
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Usar una base nueva, no la de semana 7. No compartir .env ni usar las
contraseñas ficticias del ejemplo para otros servicios.

## 2. Crear esquema y datos

Ejecutar uno a uno:

```text
npm run db:create
npm run db:migrate
npm run db:seed
npm run db:check
```

Cada comando tiene una responsabilidad: crear la DB, crear tablas, cargar datos
y comprobar conexión/esquema/recuentos. El último debe mostrar tres niveles OK.
Una base recién preparada contiene Ana y Luis y diez tareas.

Abrir pgAdmin, refrescar Databases y seleccionar aula_web_semana08. En Query Tool:

```sql
SELECT id, email, role FROM users ORDER BY id;
SELECT id, title, done, user_id FROM tasks ORDER BY id;
```

Ver dos usuarios y sus tareas confirma que no estamos usando datos en memoria.
El script seed es preparación: no es una ruta HTTP ni forma parte del login.

## 3. Arrancar y comprobar la API

```text
npm start
```

Dejar esta terminal abierta. Abrir Postman Desktop, importar
postman/Semana-08.postman_collection.json y comprobar baseUrl=http://localhost:3000
en las variables de la colección. En Postman web se necesita Desktop Agent.

Ejecutar GET /health y GET /health/db: ambos deben responder 200.
En src/app.js se puede localizar cada ruta. El segundo consulta PostgreSQL.
Si falla, corregir el entorno antes de continuar.

## 4. Iniciar sesión y seguir el token

Ejecutar primero GET /tasks sin autorización: 401. Abrir src/app.js y localizar
el montaje de /tasks con auth: la petición aún no llega al controlador.

En Postman, abrir Login Ana, POST /auth/login, con Body → raw → JSON:

```json
{ "email": "ana@example.com", "password": "AulaSegura8!" }
```

Esperar 200 y { "token": "..." }. La petición de la colección guarda el token
en anaToken. Si se crea una petición manual, copiarlo y usar Authorization →
Bearer Token; no añadir también una segunda cabecera Authorization.

Seguir estos archivos en orden:

1. src/routes/auth.js: selecciona login y valida el body.
2. src/controllers/authController.js, login: recibe email/password.
3. src/models/usersModel.js, findByEmail: busca el usuario en PostgreSQL.
4. login continúa: bcrypt.compare comprueba la contraseña y jwt.sign crea el token.
5. Postman recibe el token; la contraseña y su hash no aparecen en la respuesta.

Volver a GET /tasks con Bearer {{anaToken}}: 200 y solo tareas de Ana.
Leer src/middleware/auth.js línea a línea: leer cabecera, extraer token,
jwt.verify, guardar req.user y next(). El token identifica a quien pide los datos.

## 5. Crear una tarea y verla en PostgreSQL

POST /tasks con Bearer {{anaToken}} y JSON:

```json
{ "title": "Preparar la práctica", "done": false }
```

Esperar 201 y un objeto con id/title/done/userId. Anotar el id devuelto.
Si se usa la petición Crear de la colección, se guarda en createdTaskId.

Seguir el recorrido de esta petición:

| Paso | Archivo | Qué sucede |
|---|---|---|
| 1 | middleware/auth.js | verify identifica a Ana y deja su id en req.user.sub |
| 2 | routes/tasks.js | selecciona POST y aplica validate |
| 3 | validators/schemas.js y middleware/validate.js | comprueban title/done |
| 4 | controllers/tasksController.js, create | obtiene el propietario del token |
| 5 | models/tasksModel.js, create | INSERT parametrizado a través del pool |
| 6 | utils/taskDto.js | transforma user_id a userId para la respuesta |
| 7 | controlador | responde 201; Postman recibe la tarea persistida |

En pgAdmin, repetir:

```sql
SELECT id, title, done, user_id FROM tasks ORDER BY id DESC;
```

Localizar la tarea por el id recibido. Hacer GET /tasks/ID con Ana: 200.
Así se ve el recorrido completo de escritura y lectura, no solo el token.

## 6. Distinguir autenticación de autorización

Ejecutar Login Luis (misma contraseña ficticia); la colección guarda luisToken.
Hacer GET /tasks/ID de la tarea recién creada con Bearer {{luisToken}}: 403.
Cambiar a anaToken: 200. Quitar el token: 401.

Abrir tasksController.requireOwnedTask. Luis está autenticado, pero la tarea
pertenece a Ana. El controlador toma esa decisión después de consultar el modelo.
Un id inexistente da 404. No usar un id fijo sin comprobar que existe.

## 7. Actualizar, paginar y provocar un error

Con Ana, PATCH /tasks/ID y { "done": true }: 200. Repetir el SELECT en pgAdmin
y comprobar que done ha cambiado. GET /tasks?page=1&limit=2 devuelve dos tareas
propias; page=2 devuelve las siguientes. Seguir list → findByOwner → SQL.

Enviar POST /tasks con { "title": "   " }: 400. Mostrar que validate detiene
la petición antes del controlador. Enviar userId en el body también da 400:
no se puede escoger el propietario de una tarea desde el cliente.

Por último, DELETE /tasks/ID como Ana: 204. GET de ese id da 404 y el SELECT
ya no contiene esa fila. Se elimina solo la tarea creada para esta prueba.

## 8. Mostrar el registro

POST /auth/register con un email ficticio nuevo y contraseña de al menos ocho
caracteres. Ejemplo: { "email": "prueba@example.com", "password": "RegistroSeguro8!" }.
Primera vez: 201; repetir: 409. Para repetir la explicación, elegir otro email.
La colección genera uno nuevo automáticamente.

En pgAdmin:

```sql
SELECT id, email, password_hash FROM users WHERE email = 'prueba@example.com';
```

Mostrar el hash almacenado y que no coincide con el texto enviado. Hacer login
con esa cuenta y listar tareas: colección vacía, porque aún no ha creado ninguna.
No mostrar hashes o datos de cuentas reales en esta demostración.

## 9. Cuándo usar las demos

Son pausas opcionales sobre el recorrido anterior, en otra terminal dentro de
semana-08. La API puede seguir ejecutándose.

| Momento | Comando | Para qué sirve |
|---|---|---|
| Después del login | npm run demo:jwt | Observar sign, decode, verify y caducidad sin HTTP |
| Después del registro | npm run demo:hash | Comparar hashes con distinta sal y compare true/false |
| Después del 400 | npm run demo:validation | Ver safeParse con datos válidos e inválidos |
| Al explicar cabeceras/límites | npm run demo:security | Provocar 429/413/500 en un servidor aislado |
| Al explicar acceso desde navegador | npm run demo:cors | Comparar lectura desde localhost:5173 y :5174 |

La demo JWT genera un token ficticio para leerlo, no para pegarlo en la API.
Para el recorrido completo se usa siempre el token del login real de Postman.
La demo de seguridad no cambia el limitador de la API.

Para CORS, abrir las dos páginas indicadas, pegar el token de Ana y consultar
tasks. En 5173 se permite leer; en 5174 el navegador lo bloquea. La petición sigue
el mismo middleware/controlador/modelo que en Postman; cambia la política de
lectura del navegador. Postman no aplica CORS.

## 10. Dejar el entorno preparado para la práctica

- .env configurado localmente y PostgreSQL en ejecución.
- db:check correcto y /health/db en 200.
- Colección importada con baseUrl y login comprobados.
- Saber obtener un token nuevo: caduca en una hora; si hay 401, volver a login.
- Tener localizados app, rutas, auth, validate, controladores, modelos y DTO.

Ctrl+C detiene Node, pero conserva la DB. Para retomar: levantar PostgreSQL si
estaba parado, npm start y login nuevo. No volver a crear tablas ni borrar datos.

Este recorrido verifica el ejemplo. Para realizar la práctica, seguir su propio
enunciado y configurar su proyecto y su base por separado; no sobrescribir esta
DB ni confundir las modificaciones de demostración con una entrega.
