# Semana 6 - Controladores, errores y diseño REST

Este ejemplo amplía la API de tareas de la semana 5. Mantiene los datos en memoria para concentrar la explicación en tres ideas: separar rutas y controladores, centralizar los errores y diseñar un CRUD REST predecible.

La explicación detallada está en [docs/GUIA-PASO-A-PASO.md](docs/GUIA-PASO-A-PASO.md).

## Ejecutar el proyecto

```bash
npm install
cp .env.template .env
npm run dev
```

En Windows PowerShell, el segundo comando es `Copy-Item .env.template .env`.

La API queda disponible en `http://localhost:3000`.

## Recorrido de una petición

```text
request -> express.json() -> requestLogger -> tasksRouter -> tasksController -> response
                                                     \-> next(error) -> errorHandler
```

- `routes/` asocia método y URL con una función.
- `controllers/` contiene validación, consulta de datos y respuesta HTTP.
- `data/` contiene el array temporal que más adelante se sustituirá por una base de datos.
- `middleware/` procesa todas las peticiones o todos los errores.
- `utils/taskDto.js` define los campos públicos de una tarea.

## Endpoints

| Método | Ruta | Respuesta correcta | Concepto |
| --- | --- | --- | --- |
| `GET` | `/health` | `200` | Comprobar que la API está activa. |
| `GET` | `/tasks` | `200` | Leer la colección. |
| `GET` | `/tasks/:id` | `200` o `404` | Leer un recurso concreto. |
| `POST` | `/tasks` | `201` + `Location` | Crear un recurso. |
| `PUT` | `/tasks/:id` | `200` | Reemplazar todos los campos editables. |
| `PATCH` | `/tasks/:id` | `200` | Modificar solo los campos enviados. |
| `DELETE` | `/tasks/:id` | `204` | Eliminar un recurso sin cuerpo de respuesta. |

Las respuestas de validación usan `400`, los recursos inexistentes usan `404` y los fallos no controlados se convierten en `500` mediante el middleware final.

## Probar con Postman

1. Importar `postman/Aula-Web-Tasks-REST-API.postman_collection.json`.
2. Importar `postman/Aula-Web-Local.postman_environment.json`.
3. Seleccionar el entorno **Aula Web - Local**.
4. Iniciar la API y enviar las peticiones en el orden de la colección.

La colección incluye casos correctos, validaciones y respuestas `404`.
