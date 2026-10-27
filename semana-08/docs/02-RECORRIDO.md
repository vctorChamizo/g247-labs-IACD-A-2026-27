# Relacionar el deck con el código

El ejemplo completo está preparado para observar resultados, leer una función
y volver a ejecutar la misma petición. No hay que reconstruir el pool ni toda
la persistencia durante la explicación de autenticación.

| Diapositivas | Archivos principales | Comprobación |
|---|---|---|
| 2–5 | Postman, `db/seed.js` | Dos cuentas y dos identidades; el token no contiene contraseña |
| 6 | `demos/01-jwt.js`, `src/controllers/authController.js` | sign añade iat/exp; payload sub/role |
| 7–8 | `src/middleware/auth.js` | Bearer → verify → req.user → next |
| 9 | `src/app.js`, `src/routes/auth.js`, `src/routes/tasks.js` | /auth público; /tasks protegido |
| 10 | `src/controllers/tasksController.js` | Propia 200, ajena 403, inexistente 404 |
| 11–12 | `demos/cors/`, configuración de app.js | Navegador permitido frente a no permitido |
| 13–14 | `demos/02-hash.js` | Sal distinta y compare true/false; bytes UTF-8 |
| 15–16 | authController y `src/models/usersModel.js` | Registro 201/409; login 200/401 |
| 17–18 | demo:jwt y nuevo login | Caducado 401; refresh solo concepto |
| 19–21 | `demos/03-validation.js`, validators/schemas y middleware/validate | 400 antes de consultar la DB |
| 22–23 | utils/pagination, tasksController.list y tasksModel.findByOwner | { page, limit, items }, solo propios |
| 24–25 | `demos/04-security.js`, app y errorHandler | Cabeceras, 429, 413, 500 sin detalles |
| 26 | Enunciado de L7 | Relacionar responsabilidades; no confundir ejemplo con entrega |

## 1. Autenticación y autorización

Ejecutar `demo:jwt` sin DB para separar firmar, leer y verificar. Después usar
el login de las cuentas del seed: las contraseñas ya están preparadas; su hash
se explica en el bloque siguiente. No existe una ruta de demo para emitir
tokens de cualquier identidad.

Colocar un breakpoint después de `req.user = jwt.verify(...)` y otro al entrar en
`tasksController.getOne`. Es el mismo objeto req que atraviesa ambas funciones.
Un token válido no permite acceder a la tarea de otro usuario.

`auth` lee Bearer, verifica firma y caducidad con HS256, guarda el payload en
req.user y continúa con next(). El login es quien construye sub/role.
Decodificar un JWT no verifica su firma.

## 2. Diferencias respecto a la semana 7

- `createTasksController({ tasksModel })` recibe el modelo ya construido; la
  aplicación conecta dependencias y el controlador no crea pools.
- Las filas del modelo conservan `user_id`; `toDTO` lo convierte a `userId`.
  La comparación de propietario utiliza el mismo nombre que el SQL del deck.
- El propietario sale de `req.user.sub`. Zod rechaza `userId` en el body.
- `users` añade password_hash y role; por eso se usa una DB nueva.
- La configuración cambia de variables PG separadas a DATABASE_URL para
  alinearse con L7. Son dos formas de expresar la misma conexión.
- No se arrastra priority ni el campo privado de la demo anterior: el contrato
  público de este bloque se centra en id/title/done/userId.

## 3. CORS en navegador

Con la API en una terminal, ejecutar `npm run demo:cors` en otra. Abrir
`http://localhost:5173` y `http://localhost:5174`. Es la misma página servida desde
orígenes distintos. El token que se pegue permanece en memoria; se pierde al
recargar, sin localStorage ni cookies.

Consultar health y después tasks con el token de Ana. En 5173 se puede leer
la respuesta. En 5174 el navegador no concede acceso; comprobar Console/Network.
Authorization provoca un preflight OPTIONS que se resuelve antes de auth.

Postman puede recibir un 200 desde un origen no permitido: no aplica CORS.
CORS controla la lectura por JavaScript del navegador, no sustituye autenticación
ni autorización. origin '*' con credenciales no concede acceso universal:
el navegador bloquea la lectura de esa respuesta. Aquí se usa una lista explícita.
credentials:true se muestra como en el deck, pero el flujo Bearer de este ejemplo
no usa cookies ni necesita credentials:include en fetch.

## 4. Contraseñas y registro

Ejecutar `demo:hash`. Dos hashes de la misma contraseña difieren por la sal;
comparar no descifra. El coste es 10. El límite de 72 bytes se comprueba antes
del hash y del compare, sin truncamiento silencioso.

El registro valida, busca duplicados, hashea, escribe y responde solo id/email.
La restricción UNIQUE protege también ante dos registros simultáneos.
El cliente no elige el rol. El login devuelve el mismo mensaje para cuenta
desconocida y contraseña incorrecta; no es una demostración de protección
completa frente a todos los canales temporales de enumeración.

## 5. Zod y paginación

Leer esquema → middleware validate → controlador. `trim().min(1)` rechaza títulos
en blanco. `.strict()` rechaza claves extra como userId. done tiene default false
en POST, es obligatorio en PUT y es el único campo editable por PATCH.

El helper de páginas valida la cadena entera completa. A diferencia del parseInt
abreviado del deck, 2abc y 2.7 usan fallback: page=1. Los enteros fuera del rango
se limitan: page=0 pasa a 1 y limit=999 pasa a 100. page máxima es 100000.
ORDER BY id hace estable la paginación de un conjunto sin cambios; insertar o
eliminar filas entre peticiones puede desplazar páginas con OFFSET.

## 6. Seguridad y ampliaciones

`demo:security` fuerza 429 con un servidor aislado de límite 3; la API usa 100
por minuto. También comprueba 413 y un error genérico 500. Los errores conocidos
400/401/403/404/409/413/429 no se convierten indiscriminadamente en 500.

La API no implementa refresh tokens. Ante 401 por caducidad se vuelve a iniciar
sesión. El ejemplo orientativo del deck no se copia como un sistema completo de
producción: faltarían revocación, almacenamiento, rotación y reconstrucción del
payload desde la identidad actual, además de otras decisiones de seguridad.

Referencias: [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken),
[bcryptjs](https://github.com/dcodeIO/bcrypt.js), [Zod](https://zod.dev/),
[CORS](https://expressjs.com/en/resources/middleware/cors/),
[Helmet](https://helmet.js.org/) y [rate limit](https://express-rate-limit.mintlify.app/reference/configuration).
