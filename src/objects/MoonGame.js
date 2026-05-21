// Máquina de estados simple para controlar el flujo de la partida
export const GameState = {
    INIT_SHOW: 'INIT_SHOW',
    INIT_LOADING_LOAD_VALUES: 'INIT_LOADING_LOAD_VALUES',
    NEW_OBJECTIVE: 'NEW_OBJECTIVE',
    SELECT_OPERATION: 'SELECT_OPERATION',
    SELECT_REGISTER_INITIAL: 'SELECT_REGISTER_INITIAL',
    SELECT_REGISTER_LAST: 'SELECT_REGISTER_LAST',
    APPLY_OPERATION: 'APPLY_OPERATION',
    CHECK_OBJECTIVE: 'CHECK_OBJECTIVE',
    COMPLETED_OBJECTIVE: 'COMPLETED_OBJECTIVE',
    ANIMATION_LOOP: 'ANIMATION_LOOP',
};

// Constantes reutilizables
const ENERGY_MAP = {
    EASY: 3,
    MEDIUM: 2.5,
    HARD: 2,
    CUSTOM: 3,
};

const INITIAL_REGISTERS_MAP = {
    EASY: 3,
    MEDIUM: 2,
    HARD: 1,
    CUSTOM: 3,
};

const UNARY_OPS = ['INC', 'DEC', 'ROL', 'ROR', 'NOT'];
const BINARY_OPS = ['MOV', 'AND', 'OR', 'XOR', 'ADD', 'SUB', 'NAND', 'NOR', 'XNOR'];

const OP_COSTS = {
    INC: 2.0, DEC: 2.0,
    ROL: 1.0, ROR: 1.0, MOV: 1.0, NOT: 1.0,
    OR: 0.5, AND: 0.5, XOR: 0.5,
    ADD: 1.5, SUB: 1.5,
    NAND: 1.0, NOR: 1.0, XNOR: 1.0,
};

const OP_GROUPS_BY_COLOR = {
    green: ['INC', 'DEC', 'ADD', 'SUB'],
    yellow: ['ROL', 'ROR'],
    pink: ['MOV'],
    red: ['OR', 'AND', 'XOR'],
    white: ['NOT', 'NOR', 'NAND', 'XNOR'],
};

const DEFAULT_OPS = ['INC', 'DEC', 'ROL', 'ROR', 'MOV', 'NOT', 'OR', 'AND', 'XOR'];
const OPS_BY_DIFFICULTY = {
    EASY: [...DEFAULT_OPS],
    MEDIUM: [...DEFAULT_OPS],
    HARD: [...DEFAULT_OPS],
    CUSTOM: [...DEFAULT_OPS],
};
const EMPTY_SLOT_TEXTURE = 'cust-square';
const RESET_EVENT_TO_COLUMN_VALUE = {
    RESET_BIT_1: 2,
    RESET_BIT_2: 4,
    RESET_BIT_3: 8,
};

// Eventos especiales
const EVENT_TYPES = {
    BUG: 'BUG',
    ERROR_OP_ROL: 'ERROR_OP_ROL',
    ERROR_OP_XOR: 'ERROR_OP_XOR',
    ERROR_OP_NOT: 'ERROR_OP_NOT',
    ERROR_REG_B: 'ERROR_REG_B',
    ERROR_REG_C: 'ERROR_REG_C',
    ERROR_REG_D: 'ERROR_REG_D',
    RESET_REG_A: 'RESET_REG_A',
    RESET_REG_B: 'RESET_REG_B',
    RESET_REG_C: 'RESET_REG_C',
    RESET_REG_D: 'RESET_REG_D',
    RESET_BIT_1: 'RESET_BIT_1',
    RESET_BIT_2: 'RESET_BIT_2',
    RESET_BIT_3: 'RESET_BIT_3',
    OK: 'OK',
};

// Texturas por tipo de evento
const EVENT_TEXTURES = {
    [EVENT_TYPES.BUG]: 'evento-bug',
    [EVENT_TYPES.ERROR_OP_ROL]: 'evento-error_rol',
    [EVENT_TYPES.ERROR_OP_XOR]: 'evento-error_xor',
    [EVENT_TYPES.ERROR_OP_NOT]: 'evento-error_not',
    [EVENT_TYPES.ERROR_REG_B]: 'evento-error_bx',
    [EVENT_TYPES.ERROR_REG_C]: 'evento-error_cx',
    [EVENT_TYPES.ERROR_REG_D]: 'evento-error_dx',
    [EVENT_TYPES.RESET_REG_A]: 'evento-reset_ax',
    [EVENT_TYPES.RESET_REG_B]: 'evento-reset_bx',
    [EVENT_TYPES.RESET_REG_C]: 'evento-reset_cx',
    [EVENT_TYPES.RESET_REG_D]: 'evento-reset_dx',
    [EVENT_TYPES.RESET_BIT_1]: 'evento-reset_value1',
    [EVENT_TYPES.RESET_BIT_2]: 'evento-reset_value2',
    [EVENT_TYPES.RESET_BIT_3]: 'evento-reset_value3',
    [EVENT_TYPES.OK]: 'evento-ok',
};

const REGISTER_INDEX_TO_NAME = ['D', 'C', 'B', 'A'];
const REGISTER_NAME_TO_INDEX = { D: 0, C: 1, B: 2, A: 3 };

// Configuración de eventos por dificultad
const EVENT_CONFIG = {
    EASY: {
        events: [],
    },
    MEDIUM: {
        events: [
            EVENT_TYPES.RESET_REG_A,
            EVENT_TYPES.RESET_REG_B,
            EVENT_TYPES.RESET_REG_C,
            EVENT_TYPES.RESET_REG_D,
            EVENT_TYPES.BUG,
        ],
    },
    HARD: {
        events: [
            EVENT_TYPES.RESET_REG_A,
            EVENT_TYPES.RESET_REG_B,
            EVENT_TYPES.RESET_REG_C,
            EVENT_TYPES.RESET_REG_D,
            EVENT_TYPES.ERROR_REG_B,
            EVENT_TYPES.ERROR_REG_C,
            EVENT_TYPES.ERROR_REG_D,
            EVENT_TYPES.ERROR_OP_NOT,
            EVENT_TYPES.ERROR_OP_XOR,
            EVENT_TYPES.BUG,
            EVENT_TYPES.BUG,
            EVENT_TYPES.BUG,
            EVENT_TYPES.OK,
            EVENT_TYPES.OK,
            EVENT_TYPES.OK,
        ],
    },
    CUSTOM: {
        events: [],
    },
};

export default class MoonGame {
    constructor(scene, difficulty, customConfig = null) {
        this.scene = scene;
        this.difficulty = difficulty;
        this.customConfig = customConfig;
        this.binaryOpsOrder = this.resolveBinaryOpsOrder(customConfig ? customConfig.binaryOpsOrder : null);
        this.gameState = GameState.INIT_SHOW;

        // Buffers de sprites para registrar A-D y elementos de UI
        this.registers = []; // Matriz 4x4 de bits por registro
        this.rowLabels = []; // Sprites de etiquetas de fila (A, B, C, D)
        this.energySprites = []; // Sprites de energía (baterías)
        this.deckOperations = []; // Reserva para sprites/estado de operaciones del panel
        this.deckObjectives = []; // Sprites de fondo para ranuras de mazo
        this.objectiveCards = []; // Cartas mostradas encima de las ranuras
        this.eventCardBackdrops = []; // Fondo de color detrás de cartas de evento reveladas
        this.drawnCards = []; // Cartas robadas del mazo (última = ranura más cercana)
        this.disabledOperations = new Set(); // Operaciones bloqueadas por eventos
        this.disabledRegisters = new Set(); // Registros bloqueados por eventos
        this.blockedSlots = new Set(); // Slots bloqueados por BUG (índices 1..5)
        this.registerErrorOverlays = new Map(); // Overlays de error activos por registro
        this.operationErrorOverlays = new Map(); // Overlays de error activos por operación
        this.pendingRepairCard = null; // Carta OK pendiente de reparación
        this.cardFlipDuration = 500; // Duración del flip de carta (ms)
        this.eventVisibleMinMs = 2000; // Tiempo mínimo visible de un evento (ms)
        this.eventResolveDelay = this.cardFlipDuration + this.eventVisibleMinMs; // Retardo total antes de resolver el evento

        // Bloqueo de interacción hasta que terminen las animaciones iniciales
        this.canInteract = false;

        // Configura la energía inicial según dificultad o modo custom
        this.energy = this.getMaxEnergy();

        this.init();
    }

    resolveBinaryOpsOrder(order) {
        return order === 'intel' ? 'intel' : 'gnu';
    }

    isIntelBinaryOpsOrder() {
        return this.binaryOpsOrder === 'intel';
    }

    // Devuelve el máximo de energía según la dificultad
    getMaxEnergy() {
        // En CUSTOM, la energía elegida en la UI tiene prioridad sobre la tabla por dificultad.
        if (this.difficulty === 'CUSTOM' && this.customConfig && this.customConfig.energy !== undefined) {
            return this.customConfig.energy;
        }
        return ENERGY_MAP[this.difficulty] || ENERGY_MAP.CUSTOM;
    }

    // Factor de escala basado en la resolución base 1280x720
    getScaleFactor() {
        const { width, height } = this.scene.scale;
        return Math.min(width / 1280, height / 720);
    }

    // Construye el mazo base de 15 objetivos (1..15)
    buildObjectiveDeck() {
        return Array.from({ length: 15 }, (_, i) => ({ kind: 'objective', value: i + 1 }));
    }

    buildEventsForDifficulty() {
        if (this.difficulty === 'CUSTOM' && this.customConfig && this.customConfig.selectedEventKeys) {
            const events = [];
            // Convierte claves de textura a tipos de evento internos
            const textureToType = {};
            Object.entries(EVENT_TEXTURES).forEach(([type, tex]) => {
                textureToType[tex] = type;
            });

            this.customConfig.selectedEventKeys.forEach(texKey => {
                const type = textureToType[texKey];
                if (type) {
                    events.push({ kind: 'event', eventType: type });
                }
            });
            return events;
        }

        // Para modos no CUSTOM, el mazo de eventos sale directamente de EVENT_CONFIG.
        const cfg = EVENT_CONFIG[this.difficulty] || EVENT_CONFIG.CUSTOM;
        const eventTypes = Array.isArray(cfg.events) ? cfg.events : [];
        return eventTypes.map(eventType => ({ kind: 'event', eventType }));
    }

    // Durante la inicialización solo se roba de objetivos
    drawNextObjectiveFromInitDeck() {
        return this.deck.length > 0 ? this.deck.shift() : null;
    }

    injectEventsAndShuffle() {
        const events = this.buildEventsForDifficulty();
        this.deck = shuffle([...this.deck, ...events]);
        console.log('Mazo después de inyectar eventos:', this.deck);
    }

    init() {
        // Inicializa mazo SOLO con objetivos para la fase de setup de registros
        this.deck = this.buildObjectiveDeck();
        this.deck = shuffle(this.deck);
        console.log('Mazo barajado (solo objetivos):', this.deck);

        this.createBoard();

        let useAnimations = true;
        if (this.customConfig && typeof this.customConfig.useAnimations === 'boolean') {
            useAnimations = this.customConfig.useAnimations;
        }

        this.fillBoard(useAnimations);
    }

    fillBoard(useAnimations = true) {
        // Número de registros iniciales por dificultad
        let initCount = INITIAL_REGISTERS_MAP[this.difficulty] ?? INITIAL_REGISTERS_MAP.CUSTOM;
        // En CUSTOM, el valor elegido por el usuario sobrescribe el mapa por dificultad.
        if (this.difficulty === 'CUSTOM' && this.customConfig && typeof this.customConfig.initialRegistersCount === 'number') {
            initCount = this.customConfig.initialRegistersCount;
        }

        // Se necesitan cartas para init de registros + primera carta visible
        if (this.deck.length < initCount + 1) return;

        if (initCount >= 1) {
            const cardB = this.drawNextObjectiveFromInitDeck();
            if (cardB) {
                this.setRegisterValue(2, cardB.value, useAnimations);
                if (useAnimations) {
                    this.animateInitialRegister(2, cardB.value, 0);
                }
            }
        }
        if (initCount >= 2) {
            const cardC = this.drawNextObjectiveFromInitDeck();
            if (cardC) {
                this.setRegisterValue(1, cardC.value, useAnimations);
                if (useAnimations) {
                    this.animateInitialRegister(1, cardC.value, 0);
                }
            }
        }
        if (initCount >= 3) {
            const cardD = this.drawNextObjectiveFromInitDeck();
            if (cardD) {
                this.setRegisterValue(0, cardD.value, useAnimations);
                if (useAnimations) {
                    this.animateInitialRegister(0, cardD.value, 0, () => {
                        this.animateInitialObjective(useAnimations);
                    });
                }
            }
        }

        // Tras inicializar registros, se insertan eventos al mazo restante y se vuelve a barajar
        this.injectEventsAndShuffle();

        const cardObj = this.deck.shift();
        if (!cardObj) {
            console.warn('No hay suficientes cartas de objetivo para iniciar.');
            return;
        }

        const valObj = cardObj.value;
        console.log(`Reparto inicial (Registros a inicializar: ${initCount}). Objetivo actual: ${valObj}`);

        // La primera carta (objetivo o evento) entra al flujo de slots
        this.drawnCards.unshift(cardObj);
        this.currentObjective = null;

        // Si no hay animaciones, lanzamos el objetivo directamente
        if (!useAnimations) {
            this.animateInitialObjective(false);
            return;
        }

        // Si hay animaciones pero no llegamos a tener registro D (que encadena el callback), 
        // lanzamos el objetivo manualmente aquí.
        // El caso con D (initCount >= 3) se maneja en el callback de animateInitialRegister(0)
        if (initCount < 3) {
            this.animateInitialObjective(true);
        }

        this.updateObjectiveDisplay();
    }

    setRegisterValue(rowIdx, value, animated = false) {
        const register = this.registers[rowIdx];
        if (!register) return;

        // Convierte el valor a arreglo binario [MSB, ..., LSB]
        // Valor entre 0 y 15.
        // Bit 0 (MSB) -> 8, Bit 3 (LSB) -> 1
        // Mantiene visible únicamente los bits en 1
        for (let i = 0; i < 4; i++) {
            const bitVal = (value >> (3 - i)) & 1;

            const bitSprite = register[i];
            bitSprite.setData('value', bitVal);

            if (!animated) {
                bitSprite.setVisible(bitVal === 1);
                bitSprite.setAlpha(1);
            } else {
                // Durante la animación inicial se mantienen ocultos
                bitSprite.setVisible(false);
            }
        }
    }

    getRegisterValue(rowIdx) {
        const register = this.registers[rowIdx];
        if (!register) return 0;

        let value = 0;
        for (let i = 0; i < 4; i++) {
            const bitVal = register[i].getData('value');
            if (bitVal === 1) {
                value += Math.pow(2, 3 - i);
            }
        }
        return value;
    }

    checkWinCondition() {
        // Comprueba si el valor del registro A (índice 3) cumple el objetivo
        const valA = this.getRegisterValue(3);
        if (this.currentObjective && this.currentObjective.kind === 'objective' && valA === this.currentObjective.value) {
            console.log(`¡OBJETIVO COMPLETADO! Valor: ${valA}`);

            // Localiza la ranura del objetivo actual y lo retira
            this.removeCompletedObjective();
        }
    }

    removeCompletedObjective() {
        if (!this.currentObjective) return;

        // Buscamos el índice por referencia o por valor para ser más robustos
        const index = this.drawnCards.findIndex(c =>
            c === this.currentObjective ||
            (c.kind === this.currentObjective.kind && c.value === this.currentObjective.value)
        );

        if (index !== -1) {
            this.canInteract = false;

            // Seteamos a null inmediatamente para evitar que checkWinCondition lo vuelva a detectar
            this.currentObjective = null;

            const slotIdx = this.getSlotForDrawnIndex(index);
            const targetSprite = this.objectiveCards[slotIdx];

            console.log(`Eliminando objetivo en índice ${index} (Slot ${slotIdx})`);

            if (targetSprite) {
                this.scene.tweens.add({
                    targets: targetSprite,
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0,
                    duration: 300,
                    onComplete: () => {
                        this.drawnCards.splice(index, 1);
                        console.log(`Objetivo eliminado, cartas robadas restantes:`, this.drawnCards.length);
                        this.updateSlotDisplays();
                        this.setNextObjective();
                    }
                });
            } else {
                // Si por algún motivo no hay sprite, saltamos la animación
                this.drawnCards.splice(index, 1);
                this.updateSlotDisplays();
                this.setNextObjective();
            }
        } else {
            console.error('El objetivo actual no se encuentra en las cartas robadas:', {
                current: this.currentObjective,
                drawn: this.drawnCards
            });
            this.currentObjective = null;
        }
    }

    isObjectiveCard(card) {
        return card && card.kind === 'objective';
    }

    getPlayableSlotIndices() {
        const slots = [];
        for (let slotIdx = 1; slotIdx <= 5; slotIdx++) {
            if (!this.blockedSlots.has(slotIdx)) {
                slots.push(slotIdx);
            }
        }
        return slots;
    }

    getSlotForDrawnIndex(drawnIndex) {
        const playableSlots = this.getPlayableSlotIndices();
        return playableSlots[drawnIndex] || null;
    }

    setNextObjective() {
        if (this.pendingRepairCard) {
            this.updateSlotDisplays();
            return;
        }

        this.currentObjective = null;

        if (this.drawnCards.length === 0) {
            if (this.deck.length === 0) {
                console.log('¡No hay más objetivos! ¡Has ganado!');
                this.updateObjectiveDisplay();
                this.checkGameEndConditions();
                return;
            }

            const next = this.deck.shift();
            if (next) {
                // Al robar automáticamente una carta al quedarse sin ninguna, recargamos energía
                this.energy = this.getMaxEnergy();
                this.updateEnergyUI(true);
                this.updateOperationHighlights(true);
                console.log(`Energía recargada a: ${this.energy} por auto-robo`);

                this.animateDrawCard(next);
            }
            return;
        }

        const topCard = this.drawnCards[this.drawnCards.length - 1];
        this.updateSlotDisplays();

        if (this.isObjectiveCard(topCard)) {
            this.currentObjective = topCard;
            this.updateObjectiveDisplay();
            this.checkGameEndConditions();
            this.canInteract = true;
            return;
        }

        if (topCard.kind === 'empty') {
            console.log('La carta vacía ha llegado al slot activo. El jugador tiene que realizar operaciones o esperar, pero no se auto-consume.');
            this.currentObjective = null;
            this.checkGameEndConditions();
            this.canInteract = true;
            return;
        }

        this.resolveEventCard(topCard);
    }

    registerIndexToName(idx) {
        return REGISTER_INDEX_TO_NAME[idx] || '';
    }

    registerNameToIndex(name) {
        return REGISTER_NAME_TO_INDEX[name];
    }

    resetBitColumnByValue(columnValue) {
        for (let rowIdx = 0; rowIdx < this.registers.length; rowIdx++) {
            const currentValue = this.getRegisterValue(rowIdx);
            const nextValue = currentValue & (~columnValue & 0b1111);
            this.setRegisterValue(rowIdx, nextValue, false);
        }
    }

    addRegisterErrorOverlay(regName, textureKey) {
        if (this.registerErrorOverlays.has(regName)) return;
        const rowIdx = this.registerNameToIndex(regName);
        const target = this.rowLabels[rowIdx];
        if (!target) return;

        const overlay = this.scene.add.image(target.x, target.y, textureKey);
        overlay.setDisplaySize(target.displayWidth, target.displayHeight);
        overlay.setDepth(5);
        overlay.setInteractive({ useHandCursor: true });
        overlay.on('pointerdown', () => this.tryRepairError({ type: 'register', key: regName }));
        this.registerErrorOverlays.set(regName, overlay);
    }

    addOperationErrorOverlay(opType, textureKey) {
        if (this.operationErrorOverlays.has(opType)) return;
        const target = this.operationSprites ? this.operationSprites[opType] : null;
        if (!target) return;

        const overlay = this.scene.add.image(target.x, target.y, textureKey);
        overlay.setDisplaySize(target.displayWidth, target.displayHeight);
        overlay.setDepth(5);
        overlay.setInteractive({ useHandCursor: true });
        overlay.on('pointerdown', () => this.tryRepairError({ type: 'operation', key: opType }));
        this.operationErrorOverlays.set(opType, overlay);
    }

    hasRepairableErrors() {
        return this.disabledRegisters.size > 0 || this.disabledOperations.size > 0 || this.blockedSlots.size > 0;
    }

    consumeTopEventCard() {
        if (this.drawnCards.length === 0) return;
        this.drawnCards.pop();
        this.pendingRepairCard = null;
        this.updateSlotDisplays();
        this.updateDisabledVisuals();
        this.updateOperationHighlights();
        this.updateRegisterBorders();
        this.setNextObjective();
    }

    resolveEventCard(card) {
        if (!card || card.kind !== 'event') return;

        console.log('Resolviendo evento', card.eventType);

        this.canInteract = false;
        this.updateSlotDisplays();

        this.scene.time.delayedCall(this.eventResolveDelay, () => {
            switch (card.eventType) {
                case EVENT_TYPES.BUG: {
                    const topIndex = this.drawnCards.length - 1;
                    const bugSlot = this.getSlotForDrawnIndex(topIndex);
                    if (bugSlot) {
                        this.blockedSlots.add(bugSlot);
                    }
                    this.consumeTopEventCard();
                    break;
                }
                case EVENT_TYPES.ERROR_OP_ROL:
                    this.disabledOperations.add('ROL');
                    this.addOperationErrorOverlay('ROL', EVENT_TEXTURES[EVENT_TYPES.ERROR_OP_ROL]);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.ERROR_OP_XOR:
                    this.disabledOperations.add('XOR');
                    this.addOperationErrorOverlay('XOR', EVENT_TEXTURES[EVENT_TYPES.ERROR_OP_XOR]);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.ERROR_OP_NOT:
                    this.disabledOperations.add('NOT');
                    this.addOperationErrorOverlay('NOT', EVENT_TEXTURES[EVENT_TYPES.ERROR_OP_NOT]);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.ERROR_REG_B:
                    this.disabledRegisters.add('B');
                    this.addRegisterErrorOverlay('B', EVENT_TEXTURES[EVENT_TYPES.ERROR_REG_B]);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.ERROR_REG_C:
                    this.disabledRegisters.add('C');
                    this.addRegisterErrorOverlay('C', EVENT_TEXTURES[EVENT_TYPES.ERROR_REG_C]);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.ERROR_REG_D:
                    this.disabledRegisters.add('D');
                    this.addRegisterErrorOverlay('D', EVENT_TEXTURES[EVENT_TYPES.ERROR_REG_D]);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.RESET_REG_A:
                    this.setRegisterBits(3, [0, 0, 0, 0], false);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.RESET_REG_B:
                    this.setRegisterBits(2, [0, 0, 0, 0], false);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.RESET_REG_C:
                    this.setRegisterBits(1, [0, 0, 0, 0], false);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.RESET_REG_D:
                    this.setRegisterBits(0, [0, 0, 0, 0], false);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.RESET_BIT_1:
                case EVENT_TYPES.RESET_BIT_2:
                case EVENT_TYPES.RESET_BIT_3: {
                    const columnValue = RESET_EVENT_TO_COLUMN_VALUE[card.eventType];
                    if (columnValue === undefined) {
                        console.warn('Reset event sin mapeo de columna:', card.eventType);
                    } else {
                        this.resetBitColumnByValue(columnValue);
                    }
                    this.consumeTopEventCard();
                    break;
                }
                case EVENT_TYPES.OK:
                    if (!this.hasRepairableErrors()) {
                        this.consumeTopEventCard();
                        break;
                    }
                    this.pendingRepairCard = card;
                    this.canInteract = true;
                    break;
                default:
                    this.consumeTopEventCard();
                    break;
            }

            this.updateDisabledVisuals();
            this.updateOperationHighlights();
            this.updateRegisterBorders();
            this.checkGameEndConditions();
        });
    }

    tryRepairError(errorRef) {
        if (!this.pendingRepairCard || !errorRef) return;

        if (errorRef.type === 'register') {
            this.disabledRegisters.delete(errorRef.key);
            const overlay = this.registerErrorOverlays.get(errorRef.key);
            if (overlay) {
                overlay.destroy();
            }
            this.registerErrorOverlays.delete(errorRef.key);
        }

        if (errorRef.type === 'operation') {
            this.disabledOperations.delete(errorRef.key);
            const overlay = this.operationErrorOverlays.get(errorRef.key);
            if (overlay) {
                overlay.destroy();
            }
            this.operationErrorOverlays.delete(errorRef.key);
        }

        if (errorRef.type === 'bug') {
            this.blockedSlots.delete(errorRef.key);
        }

        this.consumeTopEventCard();
    }

    updateDisabledVisuals() {
        // Atenúa registros deshabilitados
        if (this.rowLabels) {
            this.rowLabels.forEach((labelSprite, idx) => {
                if (!labelSprite) return;
                const regName = this.registerIndexToName(idx);
                const isDisabled = this.disabledRegisters.has(regName);
                labelSprite.setAlpha(isDisabled ? 0.3 : 1);
            });
        }
    }

    createBoard() {
        const { width, height } = this.scene.scale;
        const scaleFactor = this.getScaleFactor();
        const paddingH = 40;
        const commonBottomY = height - 20 * scaleFactor;

        this.createBackground(width, height);
        this.createOperationsPanel({ scaleFactor, paddingH, commonBottomY });
        this.createCenterPanel({ width, scaleFactor, commonBottomY });
        this.createSlotsPanel({ width, scaleFactor, paddingH, commonBottomY });

        this.updateEnergyUI();
        // updateOperationHighlights ya no se llama aquí para esperar a la animación del objetivo
        this.updateSlot5Highlight();
    }

    // Dibuja el fondo base de la escena
    createBackground(width, height) {
        const bg = this.scene.add.image(width / 2, height / 2, 'mat-empty');
        bg.setDisplaySize(width, height);
    }

    // Construye el panel izquierdo de operaciones
    createOperationsPanel({ scaleFactor, paddingH, commonBottomY }) {
        let activeOps = OPS_BY_DIFFICULTY[this.difficulty] || DEFAULT_OPS;
        // En CUSTOM, el panel usa exactamente las operaciones marcadas en la pantalla de configuración.
        if (this.difficulty === 'CUSTOM' && this.customConfig && this.customConfig.selectedOpKeys) {
            activeOps = this.customConfig.selectedOpKeys.map(k => k.toUpperCase());
        }

        const opsCols = 2;
        const opsRows = 5; // Siempre 5 filas (10 slots)
        const opsSpriteSize = 100 * scaleFactor;
        const opsGapX = 16 * scaleFactor;
        const opsGapY = 16 * scaleFactor;

        this.operationHighlights = {};
        this.operationSprites = {};
        this.selectedOperation = null;

        const gridHeight = opsRows * opsSpriteSize + (opsRows - 1) * opsGapY;
        const gridStartY = commonBottomY - gridHeight + opsSpriteSize / 2;

        for (let i = 0; i < 10; i++) {
            let label = 'OP';
            let isRealOp = false;

            if (i < activeOps.length) {
                label = activeOps[i];
                isRealOp = true;
            }

            const key = label.toLowerCase();

            // Posición
            const col = i % opsCols;
            const row = Math.floor(i / opsCols);
            const x = paddingH + col * (opsSpriteSize + opsGapX) + opsSpriteSize / 2;
            const y = gridStartY + row * (opsSpriteSize + opsGapY);

            // Highlight
            const highlight = this.scene.add.image(x, y, 'color-white-border');
            highlight.setDisplaySize(opsSpriteSize, opsSpriteSize);
            highlight.setOrigin(0.5);
            highlight.setDepth(1);
            highlight.setVisible(false);

            // Sprite de la operación
            const img = this.scene.add.image(x, y, key).setDisplaySize(opsSpriteSize, opsSpriteSize).setOrigin(0.5);
            img.setDepth(2);

            if (isRealOp) {
                img.setInteractive({ useHandCursor: true });
                img.on('pointerdown', () => this.onOperationClicked(label, img));

                // Guardar referencias
                this.operationHighlights[label] = highlight;
                this.operationSprites[label] = img;
            }
            // Si es relleno 'OP', no guardamos evento ni highlight interactivo
        }
    }

    // Construye la matriz central A–D y elementos auxiliares
    createCenterPanel({ width, scaleFactor, commonBottomY }) {
        const centerCols = 5;
        const centerRows = 6;
        const centerSpriteSize = 100 * scaleFactor;
        const centerGapX = 15 * scaleFactor;
        const centerGapY = 15 * scaleFactor;

        const rows = ['D', 'C', 'B', 'A'];
        const cols = ['8', '4', '2', '1'];
        const extraLabels = ['W', 'X', 'Y', 'Z'];

        const centerSprites = [];

        // Fila de energía
        extraLabels.forEach((lab, idx) => {
            centerSprites.push({ row: 0, col: idx + 1, type: 'energy', index: idx });
        });

        // Fila de cabeceras y flecha de regreso
        centerSprites.push({ row: 1, col: 0, type: 'arrow', label: '▲' });
        cols.forEach((c, i) => {
            centerSprites.push({ row: 1, col: i + 1, type: 'header', label: c, index: i });
        });

        // Filas de registros
        for (let i = 0; i < 4; i++) {
            this.registers[i] = [];
        }

        rows.forEach((r, rowIdx) => {
            centerSprites.push({ row: rowIdx + 2, col: 0, type: 'rowLabel', label: r, index: rowIdx });
            for (let colIdx = 0; colIdx < cols.length; colIdx++) {
                centerSprites.push({ row: rowIdx + 2, col: colIdx + 1, type: 'cell', rowLabel: r, colLabel: cols[colIdx], rowIdx, colIdx });
            }
        });

        const centerGridWidth = centerCols * centerSpriteSize + (centerCols - 1) * centerGapX;
        const centerGridHeight = centerRows * centerSpriteSize + (centerRows - 1) * centerGapY;
        const centerGridStartX = width / 2 - centerGridWidth / 2 + centerSpriteSize / 2;
        const centerGridStartY = commonBottomY - centerGridHeight + centerSpriteSize / 2;

        centerSprites.forEach((sprite) => {
            const x = centerGridStartX + sprite.col * (centerSpriteSize + centerGapX);
            const y = centerGridStartY + sprite.row * (centerSpriteSize + centerGapY);

            if (sprite.type === 'energy') {
                const img = this.scene.add.image(x, y, 'bat-empty').setDisplaySize(centerSpriteSize, centerSpriteSize).setOrigin(0.5);
                this.energySprites[sprite.index] = img;
            } else if (sprite.type === 'arrow') {
                const arrowImg = this.scene.add.image(x, y, 'menu-return').setDisplaySize(centerSpriteSize, centerSpriteSize).setOrigin(0.5);
                arrowImg.setInteractive({ useHandCursor: true });
                arrowImg.on('pointerdown', () => this.scene.scene.start('MenuScene'));
            } else if (sprite.type === 'header') {
                const bitValueIndex = 3 - sprite.index;
                const bitValueKey = `mat-bit-value-${bitValueIndex}`;
                this.scene.add.image(x, y, bitValueKey).setDisplaySize(centerSpriteSize, centerSpriteSize).setOrigin(0.5);
            } else if (sprite.type === 'rowLabel') {
                const registerIndex = rows.length - 1 - sprite.index;
                const registerKey = `mat-register-${registerIndex}`;

                const border = this.scene.add.image(x, y, 'color-white-border');
                border.setDisplaySize(centerSpriteSize, centerSpriteSize);
                border.setOrigin(0.5);
                border.setDepth(2);
                border.setVisible(false);

                // Capa de relleno coloreada para el registro
                const fill = this.scene.add.image(x, y, 'color-white-selected');
                fill.setDisplaySize(centerSpriteSize, centerSpriteSize);
                fill.setOrigin(0.5);
                fill.setDepth(1.1);
                fill.setVisible(false);

                const img = this.scene.add.image(x, y, registerKey).setDisplaySize(centerSpriteSize, centerSpriteSize).setOrigin(0.5);
                img.setInteractive({ useHandCursor: true });
                img.on('pointerdown', () => this.onRegisterClicked(sprite.index, -1));
                img.setDepth(1);

                this.rowLabels[sprite.index] = img;

                if (!this.registerBorders) this.registerBorders = [];
                if (!this.registerFills) this.registerFills = [];
                this.registerBorders[sprite.index] = border;
                this.registerFills[sprite.index] = fill;
            } else if (sprite.type === 'cell') {
                const imgBase = this.scene.add.image(x, y, 'bit0').setDisplaySize(centerSpriteSize, centerSpriteSize).setOrigin(0.5);
                imgBase.setInteractive({ useHandCursor: true });
                imgBase.on('pointerdown', () => this.onRegisterClicked(sprite.rowIdx, sprite.colIdx));

                const imgOverlay = this.scene.add.image(x, y, 'bit1').setDisplaySize(centerSpriteSize, centerSpriteSize).setOrigin(0.5);
                imgOverlay.setVisible(false);

                // Datos binarios del bit
                imgOverlay.setData('row', sprite.rowIdx);
                imgOverlay.setData('col', sprite.colIdx);
                imgOverlay.setData('value', 0);

                this.registers[sprite.rowIdx][sprite.colIdx] = imgOverlay;
            }
        });
    }

    // Construye el panel derecho de slots
    createSlotsPanel({ width, scaleFactor, paddingH, commonBottomY }) {
        const slotsRows = 6;
        const slotsSpriteSize = 100 * scaleFactor;
        const slotsGapX = 16 * scaleFactor;
        const slotsGapY = 16 * scaleFactor;

        this.slotPositions = []; // Almacenar posiciones para animaciones

        const slotsGridHeight = slotsRows * slotsSpriteSize + (slotsRows - 1) * slotsGapY;
        const slotsGridStartX = width - paddingH - slotsSpriteSize / 2;
        const slotsGridStartY = commonBottomY - slotsGridHeight + slotsSpriteSize / 2;

        for (let i = 5; i >= 0; i--) {
            const texKey = `slot-${i}`;
            const x = slotsGridStartX;
            const rowIndex = 5 - i;
            const y = slotsGridStartY + rowIndex * (slotsSpriteSize + slotsGapY);

            this.slotPositions[i] = { x, y };

            const slotBg = this.scene.add.image(x, y, texKey).setDisplaySize(slotsSpriteSize, slotsSpriteSize).setOrigin(0.5);
            slotBg.setDepth(1);
            slotBg.setData('defaultTexture', texKey);
            this.deckObjectives.push(slotBg);

            if (i === 5) {
                this.slot5Highlight = this.scene.add.image(x, y, 'color-white-selected');
                this.slot5Highlight.setDisplaySize(slotsSpriteSize, slotsSpriteSize);
                this.slot5Highlight.setOrigin(0.5);
                this.slot5Highlight.setDepth(1.5);
                this.slot5Highlight.setVisible(false);
            }

            if (i !== 5) {
                const slotIndex = 5 - i;
                const eventBackdrop = this.scene.add.image(x, y, 'color-white-selected');
                eventBackdrop.setDisplaySize(slotsSpriteSize * 1.08, slotsSpriteSize * 1.08);
                eventBackdrop.setOrigin(0.5);
                eventBackdrop.setDepth(1.95);
                eventBackdrop.setVisible(false);
                this.eventCardBackdrops[slotIndex] = eventBackdrop;
            }

            const cardTexture = (i === 5) ? 'slot-5' : 'objective-1';
            const card = this.scene.add.image(x, y, cardTexture).setDisplaySize(slotsSpriteSize, slotsSpriteSize).setOrigin(0.5);
            card.setDepth(2);
            card.setVisible(i === 5);
            card.setInteractive({ useHandCursor: true });

            if (i === 5) {
                card.on('pointerdown', () => {
                    if (!this.canInteract) return;
                    if (this.pendingRepairCard) return;
                    console.log('¡Clic en slot 5!');
                    this.stealCard();
                });
            } else {
                const slotIndex = 5 - i;
                card.on('pointerdown', () => {
                    if (!this.pendingRepairCard) return;
                    if (!this.blockedSlots.has(slotIndex)) return;
                    this.tryRepairError({ type: 'bug', key: slotIndex });
                });
            }

            this.objectiveCards.push(card);
        }
    }

    onRegisterClicked(row, col) {
        if (!this.canInteract) return;
        if (this.pendingRepairCard) return;
        console.log(`Clic en registro: ${row}, ${col}`);

        const regName = this.registerIndexToName(row);
        if (this.disabledRegisters.has(regName)) {
            console.log(`El registro ${regName} está deshabilitado por un evento.`);
            return;
        }

        if (this.gameState === GameState.SELECT_REGISTER_INITIAL) {
            // Primer registro para operación binaria según orden configurado
            if (this.isIntelBinaryOpsOrder()) {
                this.targetRegisterIndex = row;
                console.log(`Registro destino seleccionado primero (Intel): ${row}`);
            } else {
                this.sourceRegisterIndex = row;
                console.log(`Registro origen seleccionado primero (GNU): ${row}`);
            }

            // Resalta registro origen (feedback visual opcional)
            this.highlightRegister(row);

            this.gameState = GameState.SELECT_REGISTER_LAST;

        } else if (this.gameState === GameState.SELECT_REGISTER_LAST) {
            // Las operaciones unarias siempre aplican sobre el registro objetivo seleccionado.
            if (UNARY_OPS.includes(this.currentOperation)) {
                this.targetRegisterIndex = row;
                console.log(`Registro destino seleccionado (Unario): ${row}`);
            } else if (this.isIntelBinaryOpsOrder()) {
                this.sourceRegisterIndex = row;
                console.log(`Registro origen seleccionado segundo (Intel): ${row}`);
            } else {
                this.targetRegisterIndex = row;
                console.log(`Registro destino seleccionado segundo (GNU): ${row}`);
            }

            // También resaltamos el registro de destino
            this.highlightRegister(row);

            this.applyOperation();
        }
    }

    onOperationClicked(opType, sprite) {
        if (!this.canInteract) return;
        if (this.pendingRepairCard) return;
        console.log(`Clic en operación: ${opType}`);

        if (this.disabledOperations.has(opType)) {
            console.log(`La operación ${opType} está deshabilitada por un evento.`);
            return;
        }

        const cost = this.getEnergyCost(opType);
        if (this.energy < cost) {
            console.log(`No hay suficiente energía para ${opType}. Coste: ${cost}, Disponible: ${this.energy}`);
            return;
        }

        // Alterna selección de operación
        if (this.selectedOperation === opType) {
            // Deselecciona
            this.selectedOperation = null;
            this.currentOperation = null;
            this.gameState = GameState.SELECT_OPERATION;
            console.log('Operación deseleccionada');
        } else {
            // Selecciona una nueva operación
            this.selectedOperation = opType;
            this.currentOperation = opType;

            // Determinar si es unario o binario
            if (UNARY_OPS.includes(opType)) {
                this.gameState = GameState.SELECT_REGISTER_LAST;
                console.log('Operación unaria seleccionada. Selecciona un registro destino.');
            } else if (BINARY_OPS.includes(opType)) {
                // El orden de clicks en binarias depende de la sintaxis elegida (GNU o Intel).
                this.gameState = GameState.SELECT_REGISTER_INITIAL;
                if (this.isIntelBinaryOpsOrder()) {
                    console.log('Operación binaria seleccionada. Orden Intel: selecciona el registro destino primero.');
                } else {
                    console.log('Operación binaria seleccionada. Orden GNU: selecciona el registro origen primero.');
                }
            } else {
                console.warn('Tipo de operación desconocido:', opType);
            }
        }

        this.updateOperationHighlights(true);
        this.updateRegisterBorders();
    }

    getOperationColor(opType) {
        if (OP_GROUPS_BY_COLOR.green.includes(opType)) return 'green';
        if (OP_GROUPS_BY_COLOR.yellow.includes(opType)) return 'yellow';
        if (OP_GROUPS_BY_COLOR.pink.includes(opType)) return 'pink';
        if (OP_GROUPS_BY_COLOR.red.includes(opType)) return 'red';
        if (OP_GROUPS_BY_COLOR.white.includes(opType)) return 'white';
        return 'white';
    }

    /**
     * Actualiza el estado visual de los highlights de las operaciones.
     * @param {boolean} animated - Si el cambio de estado debe ser animado (fade)
     */
    updateOperationHighlights(animated = false) {
        Object.keys(this.operationHighlights).forEach(opType => {
            const highlight = this.operationHighlights[opType];
            if (!highlight) return;

            const isDisabled = this.disabledOperations.has(opType);
            const cost = this.getEnergyCost(opType);
            const canAfford = !isDisabled && this.energy >= cost;

            // Feedback visual en el sprite de la operación
            const opSprite = this.operationSprites ? this.operationSprites[opType] : null;
            if (opSprite) {
                opSprite.setAlpha(isDisabled ? 0.3 : 1);
            }

            let targetAlpha = 0;
            if (canAfford) {
                if (this.selectedOperation === null) {
                    targetAlpha = 1;
                } else if (this.selectedOperation === opType) {
                    targetAlpha = 1;
                } else {
                    targetAlpha = 0;
                }
            }
            const color = this.getOperationColor(opType);
            highlight.setTexture(`color-${color}-selected`);

            if (animated) {
                if (targetAlpha > 0) highlight.setVisible(true);
                this.scene.tweens.killTweensOf(highlight);
                this.scene.tweens.add({
                    targets: highlight,
                    alpha: targetAlpha,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                        if (targetAlpha === 0) highlight.setVisible(false);
                    }
                });
            } else {
                highlight.setAlpha(targetAlpha);
                highlight.setVisible(targetAlpha > 0);
            }
        });
    }

    updateRegisterBorders() {
        console.log('updateRegisterBorders ejecutandose, registerBorders:', this.registerBorders);
        if (!this.registerBorders) return;

        if (this.selectedOperation) {
            // Muestra bordes de registros con el color de la operación
            const color = this.getOperationColor(this.selectedOperation);
            const textureName = `color-${color}-border`;
            console.log(`Aplicando bordes a los registros en color ${color} para la operación ${this.selectedOperation}, textura: ${textureName}`);

            // Comprueba que la textura exista en Phaser
            const textureExists = this.scene.textures.exists(textureName);
            console.log(`¿La textura ${textureName} existe en Phaser?:`, textureExists);

            this.registerBorders.forEach((border, index) => {
                if (border) {
                    console.log(`  Borde ${index} existe, estableciendo textura a ${textureName} `);
                    if (textureExists) {
                        border.setTexture(textureName);
                    } else {
                        console.error(`  ERROR: ¡La textura ${textureName} no se encontró en Phaser! Comprueba si el archivo de imagen existe.`);
                    }
                    border.setVisible(true);
                } else {
                    console.log(`  Borde ${index} es null o indefinido`);
                }
            });
        } else {
            console.log('Ninguna operación seleccionada, ocultando bordes de registros');
            // Oculta todos los bordes de registros
            this.registerBorders.forEach(border => {
                if (border) border.setVisible(false);
            });
            if (this.registerFills) {
                this.registerFills.forEach(fill => {
                    if (fill) fill.setVisible(false);
                });
            }
        }
    }

    /**
     * Anima la aparición de una carta con el valor sobre el label del registro (D, C, B)
     * y la hace desaparecer después de 2 segundos.
     * @param {number} rowIdx - Índice del registro
     * @param {number} value - Valor a mostrar
     * @param {number} delay - Retardo inicial
     * @param {function} onCompleteCallback - Callback al finalizar TODAS las animaciones de este registro
     */
    animateInitialRegister(rowIdx, value, delay = 0, onCompleteCallback = null) {
        const labelSprite = this.rowLabels[rowIdx];
        if (!labelSprite) return;

        const { x, y } = labelSprite;
        const scaleFactor = this.getScaleFactor();
        const centerSpriteSize = 100 * scaleFactor;
        const animDuration = 1000;

        // Crear la carta del objetivo con el valor
        const card = this.scene.add.image(x, y, `objective-${value}`);
        card.setDisplaySize(centerSpriteSize, centerSpriteSize);
        card.setDepth(20);

        const targetScaleX = card.scaleX;
        const targetScaleY = card.scaleY;

        card.setScale(0);
        card.setAlpha(0);

        this.scene.tweens.add({
            targets: card,
            scaleX: targetScaleX,
            scaleY: targetScaleY,
            alpha: 1,
            delay: delay,
            duration: animDuration,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Iniciar la animación de los bits una vez la carta está colocada
                this.animateBitsOfRegister(rowIdx);

                this.scene.time.delayedCall(2000, () => {
                    this.scene.tweens.add({
                        targets: card,
                        alpha: 0,
                        scaleX: 0,
                        scaleY: 0,
                        duration: animDuration,
                        ease: 'Back.easeIn',
                        onComplete: () => {
                            card.destroy();
                            // El objetivo aparece solo cuando la carta de valor se ha ido
                            if (onCompleteCallback) onCompleteCallback();
                        }
                    });
                });
            }
        });
    }

    /**
     * Anima la aparición del primer objetivo de la partida tras el proceso inicial.
     */
    animateInitialObjective(useAnimations = true) {
        this.updateSlotDisplays();

        // El primer objetivo siempre va al slot 4 (según la lógica de LIFO en Moon)
        // En objectiveCards, el slot del objetivo activo es el índice 1 (el 0 es slot-5/mazo)
        const cardSprite = this.objectiveCards[1];
        if (cardSprite && cardSprite.visible) {

            if (!useAnimations) {
                this.animateOperationHighlights(false);
                return;
            }

            const targetScaleX = cardSprite.scaleX;
            const targetScaleY = cardSprite.scaleY;

            cardSprite.setScale(0);
            cardSprite.setAlpha(0);

            this.scene.tweens.add({
                targets: cardSprite,
                scaleX: targetScaleX,
                scaleY: targetScaleY,
                alpha: 1,
                duration: 500,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.animateOperationHighlights(useAnimations);
                }
            });
        }
    }

    /**
     * Anima la aparición de todos los highlights de operaciones válidos simultáneamente.
     */
    animateOperationHighlights(useAnimations = true) {
        // Primero calculamos cuáles deben ser visibles según el estado actual
        this.updateOperationHighlights();

        if (!useAnimations) {
            this.setNextObjective();
            return;
        }

        const highlightsToAnimate = [];

        Object.keys(this.operationHighlights).forEach(opType => {
            const highlight = this.operationHighlights[opType];
            if (highlight && highlight.visible) {
                highlight.setAlpha(0);
                highlightsToAnimate.push(highlight);
            }
        });

        if (highlightsToAnimate.length > 0) {
            this.scene.tweens.add({
                targets: highlightsToAnimate,
                alpha: 1,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    this.setNextObjective();
                }
            });
        } else {
            this.setNextObjective();
        }
    }

    /**
     * Anima la aparición secuencial de los bits que están a 1 en un registro.
     * @param {number} rowIdx - Índice del registro
     * @param {number} delay - Retardo inicial (si es null, usa el cálculo de inicio de partida)
     * @param {function} onComplete - Callback opcional al finalizar la animación
     */
    animateBitsOfRegister(rowIdx, delay = null, onComplete = null) {
        const register = this.registers[rowIdx];
        if (!register) {
            if (onComplete) onComplete();
            return;
        }

        // Calculamos un retardo base: si no se provee, usamos el de la secuencia inicial B->C->D
        const baseRegisterDelay = (delay !== null) ? delay : Math.max(0, (2 - rowIdx) * 600);

        const bitsToAnimate = [];
        for (let i = 3; i >= 0; i--) {
            const bitSprite = register[i];
            if (bitSprite.getData('value') === 1) {
                bitsToAnimate.push(bitSprite);
            } else {
                // Aseguramos que los bits en 0 se oculten si estaban visibles
                bitSprite.setVisible(false);
            }
        }

        if (bitsToAnimate.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        bitsToAnimate.forEach((bitSprite, index) => {
            const sf = this.getScaleFactor();
            const targetSize = 100 * sf;

            // Matamos animaciones previas para evitar conflictos
            this.scene.tweens.killTweensOf(bitSprite);

            bitSprite.setVisible(true);
            bitSprite.setAlpha(0);
            bitSprite.setScale(0);

            this.scene.tweens.add({
                targets: bitSprite,
                alpha: 1,
                scaleX: targetSize / bitSprite.width,
                scaleY: targetSize / bitSprite.height,
                duration: 400,
                delay: baseRegisterDelay + (index * 100),
                ease: 'Back.easeOut',
                onComplete: () => {
                    // Solo llamamos al completar el ÚLTIMO bit de la secuencia
                    if (index === bitsToAnimate.length - 1 && onComplete) {
                        onComplete();
                    }
                }
            });
        });
    }

    // --- NUEVOS MÉTODOS AUXILIARES ---

    // Obtiene un array [b3, b2, b1, b0] de un registro
    getRegisterBits(rowIdx) {
        const register = this.registers[rowIdx];
        if (!register) return [0, 0, 0, 0];
        return register.map(bit => bit.getData('value'));
    }

    // Guarda un array de bits en un registro y actualiza visualmente
    setRegisterBits(rowIdx, bits, animated = false, onComplete = null) {
        const register = this.registers[rowIdx];
        if (!register) {
            if (onComplete) onComplete();
            return;
        }
        const scaleFactor = this.getScaleFactor();

        register.forEach((bitSprite, i) => {
            const val = bits[i] ? 1 : 0;
            bitSprite.setData('value', val);

            if (!animated) {
                bitSprite.setVisible(val === 1);
                bitSprite.setAlpha(1);
                bitSprite.setDisplaySize(100 * scaleFactor, 100 * scaleFactor);
            }
        });

        if (animated) {
            // Animamos con un delay de 0 para que sea instantáneo tras la operación
            this.animateBitsOfRegister(rowIdx, 0, onComplete);
        } else {
            if (onComplete) onComplete();
        }
    }

    // Calcula el resultado de cualquier operación
    calculateResultBits(op, targetBits, sourceBits = null) {
        // Auxiliares para decimal <-> binario
        const bitsToDec = (b) => b.reduce((acc, val, i) => acc + (val ? Math.pow(2, 3 - i) : 0), 0);
        const decToBits = (d) => {
            const res = ((d % 16) + 16) % 16;
            return Array.from({ length: 4 }, (_, i) => (res >> (3 - i)) & 1);
        };

        switch (op) {
            case 'INC': return decToBits(bitsToDec(targetBits) + 1);
            case 'DEC': return decToBits(bitsToDec(targetBits) - 1);
            case 'NOT': return targetBits.map(v => v === 0 ? 1 : 0);
            case 'ROL': {
                const msb = targetBits[0];
                return [...targetBits.slice(1), msb];
            }
            case 'ROR': {
                const lsb = targetBits[3];
                return [lsb, ...targetBits.slice(0, 3)];
            }
            case 'ADD': return decToBits(bitsToDec(sourceBits) + bitsToDec(targetBits));
            case 'SUB': return decToBits(bitsToDec(sourceBits) - bitsToDec(targetBits));
            case 'MOV': return [...sourceBits];
            case 'AND': return targetBits.map((v, i) => v & sourceBits[i]);
            case 'OR': return targetBits.map((v, i) => v | sourceBits[i]);
            case 'XOR': return targetBits.map((v, i) => v ^ sourceBits[i]);
            case 'NAND': return targetBits.map((v, i) => (v & sourceBits[i]) ? 0 : 1);
            case 'NOR': return targetBits.map((v, i) => (v | sourceBits[i]) ? 0 : 1);
            case 'XNOR': return targetBits.map((v, i) => (v ^ sourceBits[i]) ? 0 : 1);
            default: return [...targetBits];
        }
    }

    applyOperation() {
        const op = this.currentOperation;
        if (!op) return;

        console.log(`Aplicando ${op} al Destino: ${this.targetRegisterIndex} (Origen: ${this.sourceRegisterIndex})`);

        const targetBits = this.getRegisterBits(this.targetRegisterIndex);
        const sourceBits = BINARY_OPS.includes(op) ? this.getRegisterBits(this.sourceRegisterIndex) : null;

        if (BINARY_OPS.includes(op) && (this.sourceRegisterIndex === undefined || this.sourceRegisterIndex === null)) {
            console.error("Falta el registro de origen para la operación binaria");
            return;
        }

        // Bloqueamos interacción durante la animación
        this.canInteract = false;

        // 1. Calcular y aplicar (CON ANIMACIÓN)
        const resultBits = this.calculateResultBits(op, targetBits, sourceBits);
        this.setRegisterBits(this.targetRegisterIndex, resultBits, true, () => {
            // 3. Limpiar estado y actualizar UI (SOLO CUANDO TERMINA LA ANIMACIÓN)
            this.resetTurnState();

            // 4. Verificar condiciones
            this.checkWinCondition();
            this.checkGameEndConditions();

            // Restauramos interacción
            this.canInteract = true;
        });

        // 2. Consumir energía
        this.energy -= this.getEnergyCost(op);
        this.updateEnergyUI();
    }

    resetTurnState() {
        this.gameState = GameState.SELECT_OPERATION;
        this.currentOperation = null;
        this.selectedOperation = null;
        this.sourceRegisterIndex = null;
        this.targetRegisterIndex = null;
        this.clearHighlights();
        this.updateOperationHighlights(true);
        this.updateRegisterBorders();
        this.updateObjectiveDisplay();
    }

    highlightRegister(row) {
        // Resalta el fondo del registro con el color de la operación seleccionada
        const color = this.getOperationColor(this.selectedOperation || '');
        const fillTexture = `color-${color}-selected`;
        const borderTexture = `color-${color}-border`;

        if (this.registerFills && this.registerFills[row]) {
            this.registerFills[row].setTexture(fillTexture);
            this.registerFills[row].setVisible(true);
        }
        if (this.registerBorders && this.registerBorders[row]) {
            this.registerBorders[row].setTexture(borderTexture);
            this.registerBorders[row].setVisible(true);
        }
    }

    clearHighlights() {
        // Oculta los bordes personalizados al limpiar selección
        if (this.registerBorders) {
            this.registerBorders.forEach(border => {
                if (border) border.setVisible(false);
            });
        }
        if (this.registerFills) {
            this.registerFills.forEach(fill => {
                if (fill) fill.setVisible(false);
            });
        }
    }

    updateEnergyUI(animate = false) {
        const maxEnergy = this.getMaxEnergy();

        let delayCount = 0;

        // Recorremos de derecha a izquierda (índice mayor a menor)
        for (let i = this.energySprites.length - 1; i >= 0; i--) {
            const sprite = this.energySprites[i];
            if (!sprite) continue;

            const currentWidth = sprite.displayWidth;
            const currentHeight = sprite.displayHeight;
            const energyThreshold = this.energySprites.length - i;

            const shouldShow = !(
                (maxEnergy <= 3 && energyThreshold === 4) ||
                (maxEnergy <= 2 && energyThreshold === 3)
            );
            sprite.setVisible(shouldShow);
            if (!shouldShow) continue;

            let targetTexture;
            if (this.energy >= energyThreshold) {
                targetTexture = 'bat';
            } else if (this.energy > energyThreshold - 1) {
                targetTexture = 'bat-half';
            } else {
                targetTexture = 'bat-empty';
            }

            if (animate && sprite.texture.key !== targetTexture && targetTexture === 'bat') {
                // Animación de recarga de batería: solo demora la aparición de la textura de la batería (llenado progresivo)
                this.scene.time.delayedCall(delayCount * 150, () => {
                    this.scene.tweens.killTweensOf(sprite);
                    sprite.setTexture(targetTexture);
                    sprite.setDisplaySize(currentWidth, currentHeight);
                    sprite.setScale(sprite.scaleX, sprite.scaleY);
                    sprite.setAlpha(1);
                });
                delayCount++;
            } else {
                sprite.setTexture(targetTexture);
                sprite.setDisplaySize(currentWidth, currentHeight);
            }
        }
        this.updateSlot5Highlight();
    }

    getEnergyCost(op) {
        return OP_COSTS[op] || 0;
    }

    updateSlot5Highlight() {
        if (!this.slot5Highlight) return;

        const maxEnergy = this.getMaxEnergy();
        const shouldShow = this.energy < maxEnergy;

        this.animateSlot5Highlight(shouldShow);
    }

    /**
     * Anima la aparición o desaparición del highlight del mazo (slot 5)
     * @param {boolean} visible - Si el highlight debe ser visible
     */
    animateSlot5Highlight(visible) {
        const animDuration = 400;

        if (visible) {
            // Si ya está visible o hay una animación de aparición en curso, no hacemos nada
            if (this.slot5Highlight.visible && this.slot5Highlight.alpha > 0) return;

            this.slot5Highlight.setVisible(true);
            this.slot5Highlight.setAlpha(0);

            // Animación de aparición
            this.scene.tweens.add({
                targets: this.slot5Highlight,
                alpha: 1,
                duration: animDuration,
                ease: 'Power2'
            });
        } else {
            // Solo animamos si está visible y no se está ocultando ya
            if (this.slot5Highlight.visible && this.slot5Highlight.alpha > 0 && !this.isHidingSlot5) {
                this.isHidingSlot5 = true;
                this.scene.tweens.add({
                    targets: this.slot5Highlight,
                    alpha: 0,
                    duration: animDuration,
                    ease: 'Power2',
                    onComplete: () => {
                        this.slot5Highlight.setVisible(false);
                        this.isHidingSlot5 = false;
                    }
                });
            }
        }
    }

    /**
     * Anima la entrada de una carta desde el mazo (Slot 5) al Slot 4,
     * desplazando las existentes hacia abajo.
     */
    animateDrawCard(newCard) {
        this.canInteract = false;

        const playableSlots = this.getPlayableSlotIndices();
        const firstPlayableSlot = playableSlots[0];

        if (!firstPlayableSlot) {
            this.canInteract = true;
            this.checkGameEndConditions();
            return;
        }

        // 1. Animar el despazamiento de las cartas existentes un slot hacia abajo
        for (let i = 0; i < this.drawnCards.length; i++) {
            const currentSlotIdx = playableSlots[i];
            const nextSlotIdx = playableSlots[i + 1];

            if (currentSlotIdx && nextSlotIdx) {
                const sprite = this.objectiveCards[currentSlotIdx];
                const backdrop = this.eventCardBackdrops[currentSlotIdx];
                const targetPos = this.slotPositions[5 - nextSlotIdx];

                if (sprite && sprite.visible && targetPos) {
                    this.scene.tweens.add({
                        targets: sprite,
                        x: targetPos.x,
                        y: targetPos.y,
                        duration: 300,
                        ease: 'Quad.easeInOut'
                    });
                }

                if (backdrop && backdrop.visible && targetPos) {
                    this.scene.tweens.add({
                        targets: backdrop,
                        x: targetPos.x,
                        y: targetPos.y,
                        duration: 300,
                        ease: 'Quad.easeInOut'
                    });
                }
            }
        }

        // 2. Crear una carta temporal en el mazo (Slot 5) y animar hacia el primer slot
        const startPos = this.slotPositions[5];
        const targetPos = this.slotPositions[5 - firstPlayableSlot];
        const tempCard = this.scene.add.image(startPos.x, startPos.y, 'back');
        const sf = this.getScaleFactor();
        tempCard.setDisplaySize(100 * sf, 100 * sf).setDepth(10);

        this.scene.tweens.add({
            targets: tempCard,
            x: targetPos.x,
            y: targetPos.y,
            duration: 300,
            ease: 'Quad.easeInOut',
            onComplete: () => {
                tempCard.destroy();
                this.drawnCards.unshift(newCard); // Se añade al principio
                this.updateSlotDisplays();
                this.setNextObjective(); // Actualiza el objetivo actual después de añadir la carta
                this.updateSlot5Highlight();
                this.checkGameEndConditions();
            }
        });
    }

    // Devuelve la textura para una carta (objetivo o evento)
    getCardTexture(card) {
        if (!card) return 'back';
        if (card.kind === 'objective') {
            return `objective-${card.value}`;
        }
        if (card.kind === 'event') {
            return EVENT_TEXTURES[card.eventType] || 'back';
        }
        return 'back';
    }

    getEventSelectedTexture(eventType) {
        if (eventType === EVENT_TYPES.BUG) return 'color-yellow-selected';
        if (eventType === EVENT_TYPES.OK) return 'color-green-selected';
        if (String(eventType).startsWith('ERROR_')) return 'color-red-selected';
        if (String(eventType).startsWith('RESET_')) return 'color-white-selected';
        return 'color-white-selected';
    }

    updateObjectiveDisplay() {
        const valA = this.getRegisterValue(3);
        const objectiveLabel = this.currentObjective && this.currentObjective.kind === 'objective'
            ? this.currentObjective.value
            : this.currentObjective;

        // Debug logs
        console.log('=== ESTADO ACTUAL ===');
        console.log('Objetivo actual:', objectiveLabel);
        console.log('Cartas visibles (drawnCards):', this.drawnCards);
        console.log('Cartas en el mazo (deck):', this.deck);
        console.log('Valor de A:', valA);
        console.log('Energia:', this.energy);
        console.log('====================');
    }

    checkGameEndConditions() {
        const visibleSlots = this.getPlayableSlotIndices().length;

        // Perdido: más cartas que slots disponibles
        if (this.drawnCards.length > visibleSlots) {
            console.log('GAME OVER: Too many cards for available slots!');
            this.gameOver(false);
            return true;
        }

        const hasRemainingObjectives = this.drawnCards.some(c => c.kind === 'objective') ||
            this.deck.some(c => c.kind === 'objective');

        // Ganado: sin objetivos pendientes en juego ni en el mazo
        if (!hasRemainingObjectives) {
            console.log('YOU WIN: All objectives completed!');
            this.gameOver(true);
            return true;
        }

        return false;
    }

    gameOver(won) {
        console.log(won ? '¡VICTORIA!' : 'DERROTA');
        // Aquí puedes agregar lógica para mostrar pantalla de fin de juego
        // Mostramos la pantalla final y luego permitimos volver al menú
        this.scene.time.delayedCall(2000, () => {
            this.scene.scene.start('EndScene', { won });
        });
    }

    stealCard() {
        console.log('Recharging energy from slot 5');
        const maxEnergy = this.getMaxEnergy();

        // Evita recargar si ya estamos al máximo
        if (this.energy >= maxEnergy) {
            console.log('Energy is already at maximum. Cannot draw card.');
            return;
        }

        // Recarga energía al máximo y roba una carta (sea evento, objetivo o vacía)
        this.energy = maxEnergy;

        this.updateEnergyUI(true);
        this.updateOperationHighlights(true);

        console.log(`Energy recharged to: ${this.energy} `);

        // Roba una carta del mazo
        this.drawCard();
    }

    drawCard() {
        let newCard;
        if (this.deck.length === 0) {
            console.log('No more cards in the deck, drawing an empty card.');
            newCard = { kind: 'empty' };
        } else {
            newCard = this.deck.shift();
            console.log('Drew card from deck', newCard);
        }

        this.animateDrawCard(newCard);
    }

    /**
     * Anima el volteo de una carta (de reverso a frontal)
     */
    animateFlipCard(sprite, newTexture, backdrop = null, backdropTexture = null) {
        if (!sprite) return;

        // Bloqueamos para evitar que se pulse mientras gira
        this.canInteract = false;

        const sf = this.getScaleFactor();
        const cardSize = 100 * sf;
        const backdropSize = cardSize * 1.08;
        let backdropTargetScaleX = 1;

        if (backdrop && backdropTexture) {
            backdrop.setTexture(backdropTexture);
            backdrop.setVisible(true);
            backdrop.setAlpha(1);
            backdrop.setDisplaySize(backdropSize, backdropSize);
            backdropTargetScaleX = backdrop.scaleX;
        }

        // Fase 1: Encoger horizontalmente
        this.scene.tweens.add({
            targets: sprite,
            scaleX: 0,
            duration: 250,
            ease: 'Linear',
            onComplete: () => {
                // Cambiar textura en el punto medio
                sprite.setTexture(newTexture);
                if (backdrop && backdropTexture) {
                    backdrop.setTexture(backdropTexture);
                }

                // Forzamos el tamaño deseado para que Phaser calcule las escalas correctas
                sprite.setDisplaySize(cardSize, cardSize);
                const targetScaleX = sprite.scaleX;

                // Volvemos a 0 para que empiece el despliegue desde el centro
                sprite.scaleX = 0;
                if (backdrop && backdropTexture) {
                    backdrop.setDisplaySize(backdropSize, backdropSize);
                    backdropTargetScaleX = backdrop.scaleX;
                    backdrop.scaleX = 0;
                }

                // Fase 2: Volver a ensanchar hasta la escala calculada
                this.scene.tweens.add({
                    targets: sprite,
                    scaleX: targetScaleX,
                    duration: 250,
                    ease: 'Linear',
                    onComplete: () => {
                        this.canInteract = true;
                        // Forzar una última actualización para asegurar escala y posición
                        this.updateSlotDisplays();
                    }
                });

                if (backdrop && backdropTexture) {
                    this.scene.tweens.add({
                        targets: backdrop,
                        scaleX: backdropTargetScaleX,
                        duration: 250,
                        ease: 'Linear'
                    });
                }
            }
        });

        if (backdrop && backdropTexture) {
            this.scene.tweens.add({
                targets: backdrop,
                scaleX: 0,
                duration: 250,
                ease: 'Linear'
            });
        }
    }

    updateSlotDisplays() {
        const sf = this.getScaleFactor();
        const cardSize = 100 * sf;

        const playableSlots = this.getPlayableSlotIndices();

        for (let slotIndex = 1; slotIndex <= 5; slotIndex++) {
            const sprite = this.objectiveCards[slotIndex];
            const backdrop = this.eventCardBackdrops[slotIndex];
            const slotBg = this.deckObjectives[slotIndex];
            if (!sprite) continue;

            if (this.blockedSlots.has(slotIndex)) {
                if (slotBg) {
                    slotBg.setTexture(EMPTY_SLOT_TEXTURE);
                }
                if (backdrop) {
                    backdrop.setTexture(this.getEventSelectedTexture(EVENT_TYPES.BUG));
                    backdrop.setVisible(true);
                    backdrop.setAlpha(1);
                    const blockedBgPos = this.slotPositions[5 - slotIndex];
                    if (blockedBgPos) {
                        backdrop.setPosition(blockedBgPos.x, blockedBgPos.y);
                    }
                    backdrop.setDisplaySize(cardSize * 1.08, cardSize * 1.08);
                }
                sprite.setVisible(true);
                sprite.setTexture(EVENT_TEXTURES[EVENT_TYPES.BUG]);
                sprite.setAlpha(1);
                const blockedPos = this.slotPositions[5 - slotIndex];
                if (blockedPos) {
                    sprite.setPosition(blockedPos.x, blockedPos.y);
                }
                sprite.setDisplaySize(cardSize, cardSize);
                continue;
            }

            const queueIndex = playableSlots.indexOf(slotIndex);
            const card = queueIndex >= 0 && queueIndex < this.drawnCards.length ? this.drawnCards[queueIndex] : null;

            if (!card) {
                if (slotBg) {
                    const defaultTexture = slotBg.getData('defaultTexture');
                    if (defaultTexture) {
                        slotBg.setTexture(defaultTexture);
                    }
                }
                if (backdrop) {
                    backdrop.setVisible(false);
                }
                sprite.setVisible(false);
                continue;
            }

            // El activo es el más antiguo (el último del array drawnCards)
            const isActive = queueIndex === this.drawnCards.length - 1;
            const targetTexture = isActive ? this.getCardTexture(card) : 'back';
            const showEventBackdrop = isActive && card.kind === 'event';
            const targetBackdropTexture = showEventBackdrop ? this.getEventSelectedTexture(card.eventType) : null;

            if (slotBg) {
                if (showEventBackdrop) {
                    slotBg.setTexture(EMPTY_SLOT_TEXTURE);
                } else {
                    const defaultTexture = slotBg.getData('defaultTexture');
                    if (defaultTexture) {
                        slotBg.setTexture(defaultTexture);
                    }
                }
            }

            if (backdrop) {
                if (showEventBackdrop) {
                    backdrop.setTexture(this.getEventSelectedTexture(card.eventType));
                    backdrop.setVisible(true);
                    backdrop.setAlpha(1);
                } else {
                    backdrop.setVisible(false);
                }
            }

            // Si la carta ya estaba visible y era 'back', y ahora debe ser la cara...
            if (sprite.visible && sprite.texture.key === 'back' && targetTexture !== 'back') {
                this.animateFlipCard(sprite, targetTexture, backdrop, targetBackdropTexture);
            } else {
                sprite.setTexture(targetTexture);
            }

            sprite.setVisible(true);
            sprite.setAlpha(1);

            // Solo reseteamos posición y escala si no está en medio de una animación de flip
            // (el flip maneja su propio scaleX)
            if (!this.scene.tweens.isTweening(sprite)) {
                sprite.setDisplaySize(cardSize, cardSize);
                const pos = this.slotPositions[5 - slotIndex];
                if (pos) sprite.setPosition(pos.x, pos.y);
                if (backdrop && backdrop.visible && pos) {
                    backdrop.setDisplaySize(cardSize * 1.08, cardSize * 1.08);
                    backdrop.setPosition(pos.x, pos.y);
                }
            }
        }
    }
}

// Shuffle function
function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}
