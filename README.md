# Moon V2 — Vanilla JS

Este proyecto contiene la versión del juego **Moon** migrada a **Vanilla JavaScript**, **Web Components** (Custom Elements + Shadow DOM) y módulos ES6.

## Requisitos

- Navegador moderno (Chrome, Edge o Firefox actualizado).
- Servidor local para servir archivos estáticos (imprescindible por el uso de módulos ES6 y assets).
- Carpeta `assets/` con texturas, iconos y fuentes del juego.

## Ejecución local

No abras `index.html` directamente con `file://`, porque el juego carga recursos y módulos que requieren servidor web.

### Python

1. Abre una terminal en la raíz del proyecto.
2. Ejecuta:
   - `python -m http.server`
   - o `py -m http.server` (Windows)
   - o `python3 -m http.server`
3. Abre `http://localhost:8000` en el navegador.
4. Para parar el servidor: `Ctrl + C`.

Si el puerto `8000` está ocupado, usa otro puerto:

- `python -m http.server 8080`
- y abre `http://localhost:8080`

## Estructura del proyecto

- `index.html`: punto de entrada web.
- `src/main.js`: bootstrap del juego y navegación inicial.
- `src/core/`
  - `Router.js`: enrutamiento entre escenas (custom elements).
  - `AppController.js`: orquestación de partida (input, operaciones, sincronización UI).
  - `EventEmitter.js`: bus de eventos global (`gameEvents`).
- `src/model/`
  - `GameModel.js`: lógica principal del juego, reglas, mazos, eventos y estado.
  - `OperationEngine.js`: motor de operaciones sobre registros de 4 bits.
  - `Constants.js`: energía, costes, eventos por dificultad, estados del juego.
- `src/components/scenes/`
  - `SceneBoot.js`: precarga de assets y salto a menú principal.
  - `SceneMenu.js`: selección de dificultad y acceso al modo personalizado.
  - `SceneCustom.js`: configuración personalizada (energía, registros, eventos y operaciones).
  - `SceneGame.js`: creación de la partida y conexión con `AppController`.
  - `SceneEnd.js`: pantalla de fin de partida (victoria/derrota).
- `src/components/game/`
  - `MoonBoard.js`: tablero principal (operaciones, registros, slots, energía).
  - `MoonCard.js`: carta de operación clickeable.
  - `MoonRegister.js`: registro con bits binarios animados.
- `assets/`: texturas, iconos y fuentes del juego.

## Flujo de escenas

1. `SceneBoot` precarga todos los recursos gráficos.
2. `SceneMenu` permite elegir dificultad o entrar en personalización.
3. `SceneCustom` genera una configuración personalizada y la envía a `SceneGame`.
4. `SceneGame` instancia `AppController` + `MoonBoard` con dificultad/configuración.
5. `SceneEnd` muestra resultado final y permite volver al menú.

## Arquitectura

```
index.html → main.js → AppRouter
                              ↓
                    Escenas (scene-*)
                              ↓
              SceneGame → AppController ←→ GameModel
                              ↓              ↓
                         MoonBoard    OperationEngine
                              ↕
                      EventEmitter (gameEvents)
```

## Configuración por modo (actual)

Especificación funcional aplicada en `GameModel`:

```text
mode;energy;init;ops;events
easy;3;3;inc,dec,rol,ror,mov,not,or,and,xor;
medium;2.5;2;inc,dec,rol,ror,mov,not,or,and,xor;resetA,resetB,resetC,resetD,bug
hard;2;1;inc,dec,rol,ror,mov,not,or,and,xor;resetA,resetB,resetC,resetD,errorB,errorC,errorD,errorNOT,errorXOR,bug,bug,bug,ok,ok,ok
custom;3;3;inc,dec,rol,ror,mov,not,or,and,xor;
```

### Dónde está en código

- Energía por modo: `ENERGY_MAP` en `src/model/Constants.js`.
- Registros iniciales por modo: `INITIAL_REGISTERS_MAP` en `src/model/Constants.js`.
- Operaciones por defecto: `DEFAULT_OPS` en `src/model/Constants.js`.
- Eventos por modo: `EVENT_CONFIG` en `src/model/Constants.js`.
- Coste de operaciones: `OP_COSTS` en `src/model/Constants.js`.

## Configuración personalizada (CUSTOM)

`SceneCustom` envía esta estructura a `SceneGame`:

- `energy`: energía inicial máxima.
- `initialRegistersCount`: número de registros inicializados al comienzo.
- `selectedEventKeys`: eventos habilitados (por textura).
- `selectedOpKeys`: operaciones disponibles para la partida.
- `binaryOpsOrder`: orden de operandos en operaciones binarias (`gnu` = `src -> dst`, `intel` = `dst <- src`).

`GameModel` interpreta estos datos para construir mazo de eventos; `AppController` configura el panel de operaciones en `MoonBoard`.

## Mapeo de eventos

Nombres funcionales usados para documentación:

- `resetA`, `resetB`, `resetC`, `resetD`
- `errorB`, `errorC`, `errorD`
- `errorNOT`, `errorXOR`
- `bug`, `ok`

Representación interna (`EVENT_TYPES` en `Constants.js`):

- `resetA` -> `RESET_REG_A`
- `resetB` -> `RESET_REG_B`
- `resetC` -> `RESET_REG_C`
- `resetD` -> `RESET_REG_D`
- `errorB` -> `ERROR_REG_B`
- `errorC` -> `ERROR_REG_C`
- `errorD` -> `ERROR_REG_D`
- `errorNOT` -> `ERROR_OP_NOT`
- `errorXOR` -> `ERROR_OP_XOR`
- `bug` -> `BUG`
- `ok` -> `OK`

## Operaciones

Catálogo total definido en el juego:

- Unarias: `INC`, `DEC`, `ROL`, `ROR`, `NOT`
- Binarias: `MOV`, `AND`, `OR`, `XOR`, `ADD`, `SUB`, `NAND`, `NOR`, `XNOR`

Conjunto activo por defecto en los modos de la especificación:

- `INC`, `DEC`, `ROL`, `ROR`, `MOV`, `NOT`, `OR`, `AND`, `XOR`

## Orden de operandos en operaciones binarias

Se configura en `SceneCustom` y se consume en `AppController` vía `GameModel.getBinaryOpsOrder()`:

- `gnu` (default): selección `src -> dst`
- `intel`: selección `dst <- src`

Solo afecta al orden de selección de registros en operaciones binarias.

## Guía rápida de cambios

- Cambiar energía por dificultad: `ENERGY_MAP` en `src/model/Constants.js`.
- Cambiar registros iniciales por dificultad: `INITIAL_REGISTERS_MAP` en `src/model/Constants.js`.
- Cambiar operaciones por defecto: `DEFAULT_OPS` en `src/model/Constants.js`.
- Cambiar eventos por dificultad: `EVENT_CONFIG` en `src/model/Constants.js`.
- Cambiar coste de operaciones: `OP_COSTS` en `src/model/Constants.js`.
- Cambiar UI de configuración personalizada: `src/components/scenes/SceneCustom.js`.
- Cambiar reglas de partida: `src/model/GameModel.js`.
- Cambiar orquestación input/UI: `src/core/AppController.js`.

## Notas de mantenimiento

- La lógica principal está centralizada en `GameModel`, por lo que cualquier cambio de reglas debería empezar por ese archivo.
- Si añades nuevos eventos u operaciones, actualiza de forma coherente:
  - precarga en `SceneBoot.js`,
  - opciones en `SceneCustom.js`,
  - mapeos/lógica en `GameModel.js` y `Constants.js`.
