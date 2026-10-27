# Ejecutar y repetir las demostraciones

## Postman

Importar `postman/Semana-08.postman_collection.json` con Import → Files.
Usar Postman Desktop o Desktop Agent para acceder a localhost. La colección
incluye baseUrl y variables de tokens/ids; no hace falta un entorno adicional.

Ejecutar los bloques en orden. Los logins guardan anaToken/luisToken. Los listados
guardan ids reales: no se presupone que los usuarios o las tareas tengan id 1.
Crear guarda createdTaskId; PUT/PATCH/DELETE trabajan sobre esa tarea ficticia.
No sustituir estas variables por ids de una DB ajena a la demostración.

El registro genera un email ficticio nuevo en cada ejecución para repetir 201 y
después 409 sin vaciar la tabla. Esos usuarios quedan en la DB local; no tienen
tareas del seed. Repetir db:seed no elimina usuarios, tareas ni modificaciones.
Los tokens son variables de colección: no exportar una colección con tokens
rellenados ni credenciales de otros sistemas.

## Secuencia y resultados

1. Health y DB: 200.
2. Tasks sin token: 401.
3. Login Ana/Luis: 200 y tokens distintos.
4. Token manipulado: 401.
5. Listar como Ana/Luis: solo las tareas propias.
6. Leer una propia: 200; ajena: 403; inexistente: 404.
7. Crear con userId en body: 400; crear sin él: 201 y propietario del token.
8. PUT/PATCH/DELETE de la creada: 200/200/204; leerla después: 404.
9. Registro y duplicado: 201/409; login incorrecto: 401.
10. Título en blanco o done string: 400.
11. page=1&limit=2 y page=2&limit=2: dos grupos diferentes de Ana.
12. page=0&limit=999: page=1, limit=100. page=2.7: page=1.

Las assertions de Postman comprueban status y algunos contratos. Leer también
los cuerpos; no basta con que aparezca una respuesta verde.

## Casos fuera de Postman

```text
npm run demo:jwt
npm run demo:hash
npm run demo:validation
npm run demo:security
```

No requieren DB. JWT sí exige JWT_SECRET, los demás no. Ejecutarlos desde
semana-08; la configuración se carga de su propio .env.

Para CORS, arrancar API y demo:cors y comparar los dos orígenes indicados en la
guía de recorrido. Un preflight correcto es 204, no una petición autenticada.

## Persistencia y caída de servicio

Crear una tarea como Ana, anotar su id y reiniciar solo Node. Con el mismo secreto
el token sigue siendo válido hasta caducar y la tarea se conserva. Si se cambia
JWT_SECRET, el token anterior deja de ser válido aunque los datos sigan en DB.

Detener PostgreSQL desde su gestor local: health debe continuar en 200, health/db
en 503. Levantarlo y repetir health/db: vuelve a 200. No borrar tablas para
simular la caída. Si existe otra instalación en el mismo puerto, comprobar qué
servicio se está deteniendo antes de hacerlo.

## Suite automática

```text
npm test
```

Utiliza DATABASE_URL para llegar al servidor y a la DB administrativa postgres;
crea una DB aleatoria, aplica esquema y seed y la elimina al finalizar. Necesita
permiso CREATEDB. No usa ni vacía aula_web_semana08. Las pruebas de restricciones
producen errores PostgreSQL esperados; son correctas si la assertion los reconoce.

Se comprueban también la protección de bases anteriores, registro concurrente,
Bearer estricto, JWT caducado/manipulado, propiedad en todas las escrituras,
DTO, paginación, Unicode, límites de bcrypt, JSON, CORS y scripts aislados.
