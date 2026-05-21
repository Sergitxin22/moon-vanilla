# Moon V2 - Migración a Phaser 4

Este proyecto contiene la versión migrada del juego **Moon V2** usando **Phaser 4** y módulos ES6.

## Requisitos

- Navegador moderno (Chrome, Edge o Firefox actualizado).
- Conexión a internet (Phaser 4 se carga mediante CDN).
- Servidor local para servir archivos estáticos (imprescindible por el uso de módulos ES6 y assets).

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
- `src/main.js`: configuración global de Phaser e inicialización del juego.
- `src/scenes/`
  - `BootScene.js`: precarga de assets y salto a menú principal.
  - `MenuScene.js`: selección de dificultad y acceso al modo personalizado.
  - `CustomScene.js`: configuración personalizada (energía, registros, eventos y operaciones).
  - `GameScene.js`: creación de la partida y conexión con `MoonGame`.
  - `EndScene.js`: pantalla de fin de partida (victoria/derrota).
- `src/objects/MoonGame.js`: lógica principal del juego, reglas, mazos, eventos y estado.
- `src/services/ServerService.js`: peticiones HTTP al backend.
- `assets/`: texturas, iconos y fuentes del juego.

## Flujo de escenas

1. `BootScene` precarga todos los recursos gráficos.
2. `MenuScene` permite elegir dificultad o entrar en personalización.
3. `CustomScene` genera una configuración personalizada y la envía a `GameScene`.
4. `GameScene` instancia `MoonGame` con dificultad/configuración.
5. `EndScene` muestra resultado final y permite volver al menú.

## Configuración por modo (actual)

Especificación funcional aplicada en `MoonGame`:

```text
mode;energy;init;ops;events
easy;3;3;inc,dec,rol,ror,mov,not,or,and,xor;
medium;2.5;2;inc,dec,rol,ror,mov,not,or,and,xor;resetA,resetB,resetC,resetD,bug
hard;2;1;inc,dec,rol,ror,mov,not,or,and,xor;resetA,resetB,resetC,resetD,errorB,errorC,errorD,errorNOT,errorXOR,bug,bug,bug,ok,ok,ok
custom;3;3;inc,dec,rol,ror,mov,not,or,and,xor;
```

### Dónde está en código

- Energía por modo: `ENERGY_MAP` en `src/objects/MoonGame.js`.
- Registros iniciales por modo: `INITIAL_REGISTERS_MAP` en `src/objects/MoonGame.js`.
- Operaciones por modo: `OPS_BY_DIFFICULTY` en `src/objects/MoonGame.js`.
- Eventos por modo: `EVENT_CONFIG` en `src/objects/MoonGame.js`.

## Configuración personalizada (CUSTOM)

`CustomScene` envía esta estructura a `GameScene`:

- `energy`: energía inicial máxima.
- `initialRegistersCount`: número de registros inicializados al comienzo.
- `selectedEventKeys`: eventos habilitados (por textura).
- `selectedOpKeys`: operaciones disponibles para la partida.
- `binaryOpsOrder`: orden de operandos en operaciones binarias (`gnu` = `src -> dst`, `intel` = `dst <- src`).

`MoonGame` interpreta estos datos para construir mazo de eventos y panel de operaciones.

## Mapeo de eventos

Nombres funcionales usados para documentación:

- `resetA`, `resetB`, `resetC`, `resetD`
- `errorB`, `errorC`, `errorD`
- `errorNOT`, `errorXOR`
- `bug`, `ok`

Representación interna (`EVENT_TYPES`):

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

Se configura en `CustomScene` y se consume en `MoonGame`:

- `gnu`: selección `src -> dst`
- `intel`: selección `dst <- src`

Solo afecta al orden de selección de registros en operaciones binarias.

## Guía rápida de cambios

- Cambiar energía por dificultad: `ENERGY_MAP` en `src/objects/MoonGame.js`.
- Cambiar registros iniciales por dificultad: `INITIAL_REGISTERS_MAP` en `src/objects/MoonGame.js`.
- Cambiar operaciones por dificultad: `OPS_BY_DIFFICULTY` en `src/objects/MoonGame.js`.
- Cambiar eventos por dificultad: `EVENT_CONFIG` en `src/objects/MoonGame.js`.
- Cambiar coste de operaciones: `OP_COSTS` en `src/objects/MoonGame.js`.
- Cambiar UI de configuración personalizada: `src/scenes/CustomScene.js`.

## Notas de mantenimiento

- La lógica principal está centralizada en `MoonGame`, por lo que cualquier cambio de reglas debería empezar por ese archivo.
- Si añades nuevos eventos u operaciones, actualiza de forma coherente:
  - precarga en `BootScene`,
  - opciones en `CustomScene`,
  - mapeos/lógica en `MoonGame`.
