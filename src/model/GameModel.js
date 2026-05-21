import { GameState, ENERGY_MAP, OP_COSTS, INITIAL_REGISTERS_MAP, EVENT_CONFIG, EVENT_TYPES } from './Constants.js';
import { gameEvents } from '../core/EventEmitter.js';

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

export class GameModel {
    constructor(difficulty = 'EASY', customConfig = null) {
        this.difficulty = difficulty;
        this.customConfig = customConfig;
        this.state = GameState.INIT_SHOW;

        this.energy = this.getMaxEnergy();
        this.registers = { A: 0, B: 0, C: 0, D: 0 };
        this.targetRegister = 'A';
        this.currentObjective = null;

        this.deck = [];
        this.drawnCards = [];
        this.disabledOperations = new Set();
        this.disabledRegisters = new Set();
        this.blockedSlots = new Set();
        this.pendingRepairCard = null;

        this.selectedOperation = null;
        this.selectedRegisters = [];
        this._bugIdCounter = 0;

        this.initGame();
    }

    setState(newState) {
        this.state = newState;
        // Optionally emit state change event
        // gameEvents.emit('STATE_CHANGED', newState);
    }

    getMaxEnergy() {
        if (this.difficulty === 'CUSTOM' && this.customConfig && this.customConfig.energy !== undefined) {
            return this.customConfig.energy;
        }
        return ENERGY_MAP[this.difficulty] || ENERGY_MAP.CUSTOM;
    }

    updateEnergy(cost) {
        this.energy = Math.max(0, parseFloat((this.energy - cost).toFixed(2)));
        gameEvents.emit('ENERGY_UPDATED', this.energy);
        // Energía en 0 no es game over; el jugador queda bloqueado hasta robar carta (stealCard)
    }

    getEnergyCost(opName) {
        return OP_COSTS[opName] || 1.0;
    }

    checkWinCondition() {
        if (!this.currentObjective || this.currentObjective.kind !== 'objective') return;

        // Según el motor original la condición de victoria es en el registro 'A' (por defecto) o target
        const valA = this.registers[this.targetRegister];

        if (valA === this.currentObjective.value) {
            console.log(`¡OBJETIVO COMPLETADO! Valor: ${valA}`);

            // Bloquear interacciones durante la animación de salida (300ms, como canInteract=false en Phaser)
            this.setState(GameState.ANIMATING);

            // Emitir evento: la carta animará su salida en el board; la eliminación real
            // y setNextObjective ocurren en AppController tras la animación (como removeCompletedObjective en Phaser)
            gameEvents.emit('OBJECTIVE_COMPLETED', this.currentObjective);
        }
    }

    stealCard() {
        const maxEnergy = this.getMaxEnergy();
        if (this.energy >= maxEnergy) {
            console.log('Energy is already at maximum. Cannot steal card.');
            return false;
        }

        // Recargar energía
        this.energy = maxEnergy;
        gameEvents.emit('ENERGY_UPDATED', this.energy);
        console.log(`Energía recargada a: ${this.energy} por robo manual`);

        // Robar carta del mazo (vacía si no quedan)
        // push: la nueva carta queda en [length-1] = la posición que lee updateSlots como carta activa
        const newCard = this.deck.length > 0 ? this.deck.shift() : { kind: 'empty' };
        this.drawnCards.push(newCard);
        gameEvents.emit('SLOTS_UPDATED', this.drawnCards);

        // Los eventos robados van face-down; se resuelven solo cuando se destapen (drawnCards[0])
        this.checkGameEndConditions();
        return true;
    }

    hasRepairableErrors() {
        return this.disabledRegisters.size > 0 || this.disabledOperations.size > 0 || this.blockedSlots.size > 0;
    }

    consumeTopEventCard() {
        if (this.drawnCards.length === 0) return;
        this.drawnCards.shift();
        this.pendingRepairCard = null;
        gameEvents.emit('SLOTS_UPDATED', this.drawnCards);
        gameEvents.emit('DISABLED_UPDATED', {
            ops: [...this.disabledOperations],
            regs: [...this.disabledRegisters]
        });
        this.setNextObjective();
    }

    resetBitColumnByValue(columnValue) {
        const mask = ~columnValue & 0b1111;
        for (const reg of ['A', 'B', 'C', 'D']) {
            this.registers[reg] = this.registers[reg] & mask;
        }
        gameEvents.emit('REGISTERS_UPDATED', this.registers);
    }

    repairError(type, key) {
        if (!this.pendingRepairCard) return;
        if (type === 'operation') {
            this.disabledOperations.delete(key);
        } else if (type === 'register') {
            this.disabledRegisters.delete(key);
        } else if (type === 'bug') {
            this.blockedSlots.delete(key);
        }
        this.consumeTopEventCard();
    }

    checkGameEndConditions() {
        const maxSlots = 5;
        const usedSlots = this.drawnCards.length + this.blockedSlots.size;
        if (usedSlots > maxSlots) {
            console.log('GAME OVER: Too many cards for available slots!');
            this.setState(GameState.GAME_OVER);
            gameEvents.emit('GAME_OVER', { won: false });
            return;
        }
        if (this.drawnCards.length === 0 && this.deck.length === 0) {
            console.log('YOU WIN: All objectives completed!');
            this.setState(GameState.GAME_OVER);
            gameEvents.emit('GAME_OVER', { won: true });
        }
    }

    setNextObjective() {
        if (this.pendingRepairCard) {
            gameEvents.emit('SLOTS_UPDATED', this.drawnCards);
            return;
        }

        // Eliminar cartas vacías del frente (generadas cuando el mazo se agotó con stealCard)
        while (this.drawnCards.length > 0 && this.drawnCards[0].kind === 'empty') {
            this.drawnCards.shift();
        }

        if (this.drawnCards.length === 0) {
            if (this.deck.length === 0) {
                console.log('¡No hay más objetivos! ¡Has ganado!');
                this.setState(GameState.GAME_OVER);
                gameEvents.emit('GAME_OVER', { won: true });
                return;
            }

            // Auto-robo recarga la energía según la lógica de MoonGame.js
            this.energy = this.getMaxEnergy();
            gameEvents.emit('ENERGY_UPDATED', this.energy);
            console.log(`Energía recargada a: ${this.energy} por auto-robo`);

            const next = this.deck.shift();
            if (next) {
                this.drawnCards.unshift(next);
                if (next.kind === 'objective') {
                    this.currentObjective = next;
                } else {
                    // Es un evento
                    this.resolveEvent(next);
                }
            }
        } else {
            // La carta activa es siempre drawnCards[0] (la más antigua, face-up)
            const activeCard = this.drawnCards[0];
            if (activeCard.kind === 'objective') {
                this.currentObjective = activeCard;
            } else {
                this.resolveEvent(activeCard);
            }
        }

        // Notificamos a la visual que hay un nuevo marco de referencia
        if (this.currentObjective) {
            gameEvents.emit('NEW_OBJECTIVE', this.currentObjective);
        }
    }

    resolveEvent(card) {
        if (!card || card.kind !== 'event') return;
        console.log('Resolviendo evento', card.eventType);

        // 500ms flip + 2000ms visible mínimo antes de resolver
        const RESOLVE_DELAY = 2500;
        const RESET_EVENT_TO_COLUMN_VALUE = {
            RESET_BIT_1: 2,
            RESET_BIT_2: 4,
            RESET_BIT_3: 8,
        };

        setTimeout(() => {
            switch (card.eventType) {
                case EVENT_TYPES.BUG: {
                    // Bloqueamos un slot usando un ID numérico único (el índice cambia tras el shift)
                    const bugId = ++this._bugIdCounter;
                    this.blockedSlots.add(bugId);
                    this.consumeTopEventCard();
                    break;
                }
                case EVENT_TYPES.ERROR_OP_ROL:
                    this.disabledOperations.add('ROL');
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.ERROR_OP_XOR:
                    this.disabledOperations.add('XOR');
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.ERROR_OP_NOT:
                    this.disabledOperations.add('NOT');
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.ERROR_REG_B:
                    this.disabledRegisters.add('B');
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.ERROR_REG_C:
                    this.disabledRegisters.add('C');
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.ERROR_REG_D:
                    this.disabledRegisters.add('D');
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.RESET_REG_A:
                    this.registers['A'] = 0;
                    gameEvents.emit('REGISTERS_UPDATED', this.registers);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.RESET_REG_B:
                    this.registers['B'] = 0;
                    gameEvents.emit('REGISTERS_UPDATED', this.registers);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.RESET_REG_C:
                    this.registers['C'] = 0;
                    gameEvents.emit('REGISTERS_UPDATED', this.registers);
                    this.consumeTopEventCard();
                    break;
                case EVENT_TYPES.RESET_REG_D:
                    this.registers['D'] = 0;
                    gameEvents.emit('REGISTERS_UPDATED', this.registers);
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
                    gameEvents.emit('PENDING_REPAIR', {
                        ops: [...this.disabledOperations],
                        regs: [...this.disabledRegisters]
                    });
                    break;
                default:
                    this.consumeTopEventCard();
                    break;
            }

            gameEvents.emit('DISABLED_UPDATED', {
                ops: [...this.disabledOperations],
                regs: [...this.disabledRegisters]
            });
            this.checkGameEndConditions();
        }, RESOLVE_DELAY);
    }

    buildObjectiveDeck() {
        return Array.from({ length: 15 }, (_, i) => ({ kind: 'objective', value: i + 1 }));
    }

    buildEventsForDifficulty() {
        if (this.difficulty === 'CUSTOM' && this.customConfig?.selectedEventKeys?.length) {
            const textureToType = {
                'evento-bug': 'BUG',
                'evento-ok': 'OK',
                'evento-error_bx': 'ERROR_REG_B',
                'evento-error_cx': 'ERROR_REG_C',
                'evento-error_dx': 'ERROR_REG_D',
                'evento-error_rol': 'ERROR_OP_ROL',
                'evento-error_xor': 'ERROR_OP_XOR',
                'evento-error_not': 'ERROR_OP_NOT',
                'evento-reset_ax': 'RESET_REG_A',
                'evento-reset_bx': 'RESET_REG_B',
                'evento-reset_cx': 'RESET_REG_C',
                'evento-reset_dx': 'RESET_REG_D',
                'evento-reset_value1': 'RESET_BIT_1',
                'evento-reset_value2': 'RESET_BIT_2',
                'evento-reset_value3': 'RESET_BIT_3',
            };
            return this.customConfig.selectedEventKeys
                .map(texKey => ({ kind: 'event', eventType: textureToType[texKey] }))
                .filter(e => e.eventType);
        }
        const cfg = EVENT_CONFIG[this.difficulty] || EVENT_CONFIG.CUSTOM;
        return cfg.events.map(eventType => ({ kind: 'event', eventType }));
    }

    initGame() {
        // Inicializa mazo SOLO con objetivos para la fase de setup de registros
        this.deck = shuffle(this.buildObjectiveDeck());
        console.log('Mazo barajado (solo objetivos):', this.deck);

        let initCount = INITIAL_REGISTERS_MAP[this.difficulty] ?? INITIAL_REGISTERS_MAP.CUSTOM;
        if (this.difficulty === 'CUSTOM' && this.customConfig && typeof this.customConfig.initialRegistersCount === 'number') {
            initCount = this.customConfig.initialRegistersCount;
        }

        if (this.deck.length < initCount + 1) return;

        // B -> 2, C -> 1, D -> 0
        if (initCount >= 1) { this.registers['B'] = this.deck.shift().value; }
        if (initCount >= 2) { this.registers['C'] = this.deck.shift().value; }
        if (initCount >= 3) { this.registers['D'] = this.deck.shift().value; }

        // Tras inicializar registros, inyectar eventos
        const events = this.buildEventsForDifficulty();
        this.deck = shuffle([...this.deck, ...events]);

        // El primer objetivo/carta activa
        const firstCard = this.deck.shift();
        if (firstCard) {
            this.drawnCards.unshift(firstCard);
            this.currentObjective = firstCard.kind === 'objective' ? firstCard : null;
        }

        console.log('Mazo después de inyectar eventos:', this.deck);
        console.log(`Reparto inicial (Registros a inicializar: ${initCount}). Objetivo actual: ${this.drawnCards[0]?.value ?? 'N/A'}`);

        // Emitimos evento de registros inicializados que recogerá AppController
        gameEvents.emit('REGISTERS_INITIALIZED', this.registers);
        if (this.currentObjective) {
            gameEvents.emit('NEW_OBJECTIVE', this.currentObjective);
        }
    }
}
