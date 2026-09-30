# Usar el agente tester de Claude Code

Esta guía explica cómo usar un agente con un papel concreto: **comprobar una API mediante tests automáticos**. El objetivo no es pedir a Claude que programe toda la aplicación.

El agente ya está definido en este proyecto. Solo es necesario abrir el proyecto y darle un objetivo claro.

## 1. Preparar el proyecto

1. Abrir en VS Code la carpeta `semana-05/`. Es importante abrir esta carpeta y no la raíz del repositorio: dentro están la API y la configuración `.claude/` del agente.
2. Abrir la terminal integrada y ejecutar:

   ```bash
   npm install
   npm test
   ```

   Al comenzar, `npm test` muestra `tests 0`. Es el punto de partida: todavía no hay pruebas automáticas.
3. Abrir Claude Code desde la extensión de VS Code o desde esa misma terminal con:

   ```bash
   claude
   ```

4. Comprobar que la sesión está iniciada. Si aparece un error de autenticación, ejecutar `/login` dentro de Claude Code e iniciar sesión con una cuenta que tenga acceso a Claude. También puede cerrarse y abrirse de nuevo Claude Code tras autenticar la cuenta.

## 2. Las tres piezas del ejemplo

```text
.claude/
├── agents/api-tester.md
├── commands/run-tests.md
└── skills/api-test-conventions/SKILL.md
```

| Pieza | Para qué sirve | Qué protege o concreta |
| --- | --- | --- |
| Agente `api-tester` | Define el rol de quien prueba la API. | Solo puede modificar ficheros dentro de `tests/`; no debe tocar `src/`. |
| Skill `api-test-conventions` | Establece las reglas reutilizables para escribir los tests. | Usa el test runner de Node, `fetch`, puertos aleatorios y un formato homogéneo. |
| Comando `/run-tests` | Repite una tarea pequeña y predecible. | Ejecuta `npm test` una vez y resume el resultado sin editar archivos. |

La separación es intencionada: el agente define **qué papel tiene**, la skill define **cómo trabaja** y el comando encapsula una **acción repetida**.

## 3. Ejecutar el agente

Escribir este mensaje en Claude Code:

```text
Use the api-tester agent to test all the API routes.
```

El agente debería:

1. Leer `src/app.js` para identificar las rutas.
2. Crear ficheros dentro de `tests/`.
3. Ejecutar `npm test`.
4. Corregir únicamente un test si el error está en el propio test.
5. Informar de los fallos que pertenezcan a la API, sin modificar `src/`.

Claude Code puede solicitar permiso antes de crear los tests o de ejecutar `npm test`. Conviene leer la acción propuesta y autorizar solo las que correspondan a `tests/` y a la ejecución de pruebas.

Al terminar, revisar primero el contenido de `tests/` y después ejecutar:

```text
/run-tests
```

Así se muestra que el comando no vuelve a razonar sobre el proyecto: simplemente ejecuta la misma suite y ofrece un resumen.

## 4. Revisar el resultado

- Los nombres de las pruebas empiezan por el método y la ruta, por ejemplo `GET /health ...`.
- Cada prueba comprueba primero el código de estado y después el cuerpo JSON.
- Los tests importan `src/app.js`, no `src/server.js`: de ese modo abren un servidor temporal en un puerto libre y lo cierran al acabar.
- El agente no modifica `src/`. Si encuentra un comportamiento inesperado, debe dejar el test fallando y explicarlo.

## 5. Experimento guiado: una regla nueva

Al final de la sección `Writing each test` de `.claude/skills/api-test-conventions/SKILL.md`, añadir temporalmente:

```text
- For every POST route, also write one test that sends a body without a title and expects status 400.
```

Repetir el mismo objetivo del agente. El test nuevo debería fallar: actualmente `POST /tasks` devuelve `201` incluso si falta `title`. Es útil porque muestra que la IA ha detectado una especificación que aún no cumple la API, pero respeta su rol y **no intenta arreglarla**.

Después del experimento, restaurar la skill si no se quiere conservar esa regla como parte de la especificación del proyecto.

## 6. Resolución de problemas

| Síntoma | Acción recomendada |
| --- | --- |
| Claude no encuentra `api-tester` | Confirmar que se ha abierto la carpeta raíz del proyecto, que contiene `.claude/`, y reiniciar la sesión de Claude Code. |
| Error `401 OAuth access token has expired` | Ejecutar `/login` y volver a autenticar la cuenta de Claude. |
| `npm test` dice `tests 0` | Es normal antes de ejecutar el agente por primera vez. |
| El agente propone editar `src/` | Rechazar la acción. La definición del agente debe limitar las ediciones a `tests/`. |
| Un test se queda bloqueado | Comprobar que el test cierra el servidor temporal al finalizar. |

## 7. Idea clave

El valor del agente no está en aceptar sus cambios sin revisión. Está en convertir una tarea repetitiva —crear y ejecutar pruebas— en un proceso con instrucciones, límites y criterios de revisión explícitos.

## Referencias

- [Subagentes personalizados de Claude Code](https://code.claude.com/docs/en/sub-agents)
- [Skills de Claude Code](https://code.claude.com/docs/en/skills)
