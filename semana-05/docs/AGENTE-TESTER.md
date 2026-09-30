# Agente tester con Claude Code

Ejemplo mínimo de un agente de IA con una *skill* propia, construido sobre una API de tareas con Express. El agente analiza las rutas disponibles, crea pruebas automáticas y comunica los resultados sin modificar el código de la API.

El ejemplo no requiere programar el agente: se define con tres ficheros Markdown dentro de la carpeta `.claude/`, que Claude lee al abrir el proyecto.

## Requisitos

- Claude Code en VS Code o en la terminal, con una sesión iniciada en una cuenta con acceso a Claude.
- Node.js 18 o superior y las dependencias instaladas con `npm install`.
- Abrir la carpeta raíz de este ejemplo en VS Code. Claude carga la configuración desde la carpeta `.claude/` del proyecto abierto.

## Qué contiene

```text
semana-05/
  .claude/
    commands/run-tests.md                   # Comando: /run-tests
    agents/api-tester.md                    # Agente: el tester
    skills/api-test-conventions/SKILL.md    # Skill: cómo se escribe un test en este proyecto
  src/                                      # La API que se prueba (no se modifica)
  tests/                                    # Lo crea el agente
```

## Prompt, comando y agente sobre el mismo proyecto

| Concepto | Qué se escribe en Claude | Qué ocurre |
|---|---|---|
| *Prompt* | `Explain what the GET /tasks route does` | Responde una vez. No cambia ningún fichero |
| Comando | `/run-tests` | Ejecuta siempre la misma acción, definida en `.claude/commands/run-tests.md`: lanza `npm test` y resume el resultado |
| Agente | `Use the api-tester agent to test all the API routes` | Recibe un objetivo, lee `src/app.js`, decide qué tests escribir, los ejecuta, corrige sus propios errores e informa |

La *skill* `api-test-conventions` es lo que el agente consulta para decidir **cómo** escribir cada test: herramienta de testing, ubicación de los ficheros, formato del nombre y qué se comprueba primero. Sin ella, cada ejecución podría producir tests con un estilo distinto.

## Usar el agente

1. Ejecutar `npm test`. No hay tests todavía: el resultado es `tests 0`.
2. Escribir el *prompt* de la tabla y observar que Claude contesta sin tocar ningún fichero.
3. Pedir el objetivo al agente, en una frase:

   ```text
   Use the api-tester agent to test all the API routes
   ```

   Durante la ejecución, Claude muestra cada paso: qué fichero lee, qué fichero crea y qué comando ejecuta.
4. Revisar la carpeta `tests/` que ha creado el agente y comprobar que sigue las reglas de la *skill*.
5. Ejecutar `/run-tests` para obtener el mismo resumen sin repetir las instrucciones.
6. **Modificar la *skill* y repetir.** Añadir temporalmente esta línea al final de la sección «Writing each test» de `SKILL.md`:

   ```text
   - For every POST route, also write one test that sends a body without a title and expects status 400.
   ```

   Pedir de nuevo el mismo objetivo al agente. Aparece un test que falla: la API responde `201` incluso sin título, porque todavía no valida el cuerpo de la petición. El agente informa del problema y **no modifica `src/`**: su papel es detectar, no corregir. Restaurar la regla temporal si no se quiere mantener como parte de la especificación.

## Qué se puede modificar

| Fichero | Cambio sugerido | Efecto |
|---|---|---|
| `SKILL.md` | Añadir una regla nueva, como la del paso 6 | Todos los tests futuros la cumplen, sin repetirla en cada *prompt* |
| `api-tester.md` | Cambiar el formato del informe final | El agente cambia cómo comunica el resultado |
| `api-tester.md` | Retirar la regla «Never modify files in `src/`» | El agente pasa a intentar corregir la API. Conviene observarlo para entender por qué un tester no debería hacerlo |
| `run-tests.md` | Pedir solo los tests que fallan | El comando devuelve un resumen más corto |

## Cuándo compensa

Configurar este agente ha llevado tres ficheros. Compensa porque probar la API es una tarea que se repite cada vez que se añade una ruta. Para una pregunta puntual sobre el código, un *prompt* directo es más simple.

## Qué muestra este ejemplo

Este ejemplo reúne las tres piezas básicas de un flujo asistido por IA: el *prompt* del agente (`api-tester.md`), la *skill* (`SKILL.md`) y la revisión de los cambios que produce. La revisión sigue siendo necesaria: un agente puede detectar un comportamiento inesperado, pero no debe decidir por sí solo cómo cambiar la API.
