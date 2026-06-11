import { GameModel } from '../model/GameModel.js';
import { OperationEngine } from '../model/OperationEngine.js';
import { gameEvents } from './EventEmitter.js';
import { GameState, DEFAULT_OPS } from '../model/Constants.js';

export class AppController {
    constructor(sceneGameContext, boardComponent, difficulty, customConfig) {
        this.scene = sceneGameContext;
        this.board = boardComponent; // Referencia a <moon-board>

        // Instanciar el modelo lógico puro
        this.model = new GameModel(difficulty, customConfig);

        // Ajustar max energy en el board visual
        this.board.setAttribute('max-energy', this.model.getMaxEnergy());

        // Configurar las operaciones disponibles (default o las seleccionadas en modo CUSTOM)
        const availableOps = (difficulty === 'CUSTOM' && customConfig?.selectedOpKeys?.length)
            ? customConfig.selectedOpKeys.slice(0, 10)
            : DEFAULT_OPS;
        this.board.setAvailableOps(availableOps);

        // Suscribirse a eventos de UI (Cartas y registros cliceados)
        this.setupEventListeners();

        // Empujar estado inicial a la UI (con secuencia animada)
        this.playStartupSequence();
    }

    async playStartupSequence() {
        this.model.setState(GameState.ANIMATING);

        // Reset visual inicial (todos registros a 0, sin carta objetivo, sin highlights)
        this.board.updateRegisters({ A: 0, B: 0, C: 0, D: 0 });
        this.board.updateEnergy(this.model.energy);
        this.board.updateSlots([], this.model);

        // Pequeña pausa dramática antes de empezar
        await new Promise(resolve => setTimeout(resolve, 400));

        // Secuencia: todas las cartas aparecen → bits B→C→D secuencial → cartas desaparecen
        const order = ['B', 'C', 'D'].filter(name => this.model.registers[name] > 0);
        if (order.length > 0 && this.board.animateStartupSequence) {
            await this.board.animateStartupSequence(order, this.model.registers);
        }

        // Aparece la carta objetivo en slot 4
        this.board.updateSlots(this.model.drawnCards, this.model);
        await new Promise(resolve => setTimeout(resolve, 700));

        // Activar objetivo o resolver evento inicial antes de habilitar interacción
        // Si ya existe un objetivo activo inicial, no volvemos a avanzar ni disparar NEW_OBJECTIVE.
        if (!this.model.currentObjective) {
            this.model.setNextObjective();
            if (this.model.isEventResolving()) {
                await new Promise(resolve => {
                    this._waitForEventResolved = () => {
                        gameEvents.off('EVENT_RESOLVED', this._waitForEventResolved);
                        resolve();
                    };
                    gameEvents.on('EVENT_RESOLVED', this._waitForEventResolved);
                });
            }
        }

        // Fade-in de los highlights de operaciones disponibles
        this.model.setState(GameState.SELECT_OPERATION);
        this.board.animateOperationHighlights(this.model);

        // Pequeña espera para que termine el fade-in antes de habilitar interacción
        await new Promise(resolve => setTimeout(resolve, 550));
        this.syncBoard();
    }

    setupEventListeners() {
        this.onOperationClicked = (opName) => this.handleOperationSelected(opName);
        this.onRegisterClicked = (regName) => this.handleRegisterSelected(regName);
        this.onEnergyUpdated = () => {
            this.board.updateOperationHighlights(this.model);
        };
        this.onObjectiveChanged = (objective) => this.renderObjective(objective);
        this.onRegistersUpdated = (regs) => {
            this.board.updateRegisters(regs);
            this.board.updateOperationHighlights(this.model);
            this.board.updateRegisterHighlights(this.model);
            this.logState();
        };
        this.onSlotsUpdated = (cards) => {
            this.board.updateSlots(cards, this.model);
        };
        this.onDisabledUpdated = () => {
            this.board.updateOperationHighlights(this.model);
            this.board.updateRegisterHighlights(this.model);
        };
        this.onGameOver = ({ won }) => {
            console.log(won ? '¡VICTORIA!' : 'DERROTA');
            this.scene.router.navigate('end', { won });
            this.destroy();
        };
        this.onDeckClicked = () => {
            if (this.isInteractionBlocked()) return;
            if (this.model.pendingRepairCard) return;
            const stolen = this.model.stealCard();
            if (stolen) {
                this.board.updateEnergy(this.model.energy);
                this.board.updateOperationHighlights(this.model);
            }
        };
        this.onOperationErrorClicked = ({ operation }) => {
            this.model.repairError('operation', operation);
        };
        this.onRegisterErrorClicked = ({ register }) => {
            this.model.repairError('register', register);
        };
        this.onBugSlotClicked = ({ bugId }) => {
            this.model.repairError('bug', bugId);
        };
        this.onPendingRepair = () => {
            this.board.updateSlots(this.model.drawnCards, this.model);
        };
        this.onObjectiveCompleted = (completedObjective) => {
            // Animar salida de la carta completada (300ms, como removeCompletedObjective en Phaser)
            this.board.animateObjectiveExit(() => {
                // Tras la animación: eliminar la carta del array y avanzar al siguiente objetivo
                const idx = this.model.drawnCards.findIndex(c => c === completedObjective);
                if (idx !== -1) this.model.drawnCards.splice(idx, 1);
                this.model.currentObjective = null;
                this.model.setState(GameState.COMPLETED_OBJECTIVE);
                this.model.setNextObjective();
                // Si el juego terminó (GAME_OVER), no actualizar el board
                if (this.model.state === GameState.GAME_OVER) return;
                // Si el siguiente era un evento (no se emitió NEW_OBJECTIVE), forzar actualización de slots
                if (!this.model.currentObjective) {
                    this.board.updateSlots(this.model.drawnCards, this.model);
                }
            });
        };

        gameEvents.on('OPERATION_CLICKED', this.onOperationClicked);
        gameEvents.on('REGISTER_CLICKED', this.onRegisterClicked);
        gameEvents.on('ENERGY_UPDATED', this.onEnergyUpdated);
        gameEvents.on('NEW_OBJECTIVE', this.onObjectiveChanged);
        gameEvents.on('REGISTERS_UPDATED', this.onRegistersUpdated);
        gameEvents.on('SLOTS_UPDATED', this.onSlotsUpdated);
        gameEvents.on('DISABLED_UPDATED', this.onDisabledUpdated);
        gameEvents.on('GAME_OVER', this.onGameOver);
        gameEvents.on('DECK_CLICKED', this.onDeckClicked);
        gameEvents.on('OPERATION_ERROR_CLICKED', this.onOperationErrorClicked);
        gameEvents.on('REGISTER_ERROR_CLICKED', this.onRegisterErrorClicked);
        gameEvents.on('BUG_SLOT_CLICKED', this.onBugSlotClicked);
        gameEvents.on('PENDING_REPAIR', this.onPendingRepair);
        gameEvents.on('OBJECTIVE_COMPLETED', this.onObjectiveCompleted);
    }

    destroy() {
        if (this._waitForEventResolved) {
            gameEvents.off('EVENT_RESOLVED', this._waitForEventResolved);
        }
        this.model.clearPendingEventTimers();
        // Importante remover listeners al salir de la partida
        gameEvents.off('OPERATION_CLICKED', this.onOperationClicked);
        gameEvents.off('REGISTER_CLICKED', this.onRegisterClicked);
        gameEvents.off('ENERGY_UPDATED', this.onEnergyUpdated);
        gameEvents.off('NEW_OBJECTIVE', this.onObjectiveChanged);
        gameEvents.off('REGISTERS_UPDATED', this.onRegistersUpdated);
        gameEvents.off('SLOTS_UPDATED', this.onSlotsUpdated);
        gameEvents.off('DISABLED_UPDATED', this.onDisabledUpdated);
        gameEvents.off('GAME_OVER', this.onGameOver);
        gameEvents.off('DECK_CLICKED', this.onDeckClicked);
        gameEvents.off('OPERATION_ERROR_CLICKED', this.onOperationErrorClicked);
        gameEvents.off('REGISTER_ERROR_CLICKED', this.onRegisterErrorClicked);
        gameEvents.off('BUG_SLOT_CLICKED', this.onBugSlotClicked);
        gameEvents.off('PENDING_REPAIR', this.onPendingRepair);
        gameEvents.off('OBJECTIVE_COMPLETED', this.onObjectiveCompleted);
    }

    isInteractionBlocked() {
        return this.model.state === GameState.GAME_OVER
            || this.model.state === GameState.ANIMATING
            || this.model.isEventResolving();
    }

    syncBoard() {
        // Registros puramente lógicos
        this.board.updateRegisters(this.model.registers);

        // Highlights e interacciones
        this.board.updateOperationHighlights(this.model);
        this.board.updateRegisterHighlights(this.model);

        // Barra de energía (baterías)
        this.board.updateEnergy(this.model.energy);
        // Los slots NO se tocan aquí — solo cambian en renderObjective (nuevo objetivo)

        this.logState();
    }

    logState() {
        const valA = this.model.registers['A'];
        const objectiveLabel = this.model.currentObjective ? this.model.currentObjective.value : 'Ninguno';
        console.log('=== ESTADO ACTUAL ===');
        console.log('Objetivo actual:', objectiveLabel);
        console.log('Cartas visibles (drawnCards):', this.model.drawnCards);
        console.log('Cartas en el mazo (deck):', this.model.deck);
        console.log('Valor de A:', valA);
        console.log('Energia:', this.model.energy);
        console.log('====================');
    }

    renderObjective(objective) {
        if (!objective) return;
        console.log(`[Controller] Activar Objetivo Físico: Valor a conseguir: ${objective.value}`);
        this.board.updateSlots(this.model.drawnCards, this.model);
    }

    handleOperationSelected(opName) {
        if (this.isInteractionBlocked()) return;

        console.log(`Clic en operación: ${opName}`);

        if (this.model.disabledOperations.has(opName)) {
            console.log(`La operación ${opName} está deshabilitada por un evento.`);
            return;
        }

        const cost = this.model.getEnergyCost(opName);
        if (this.model.energy < cost) {
            console.log(`No hay suficiente energía para ${opName}. Coste: ${cost}, Disponible: ${this.model.energy}`);
            return;
        }

        if (this.model.selectedOperation === opName) {
            console.log('Operación deseleccionada');
            this.model.selectedOperation = null;
            this.model.setState(GameState.SELECT_OPERATION);
        } else {
            this.model.selectedOperation = opName;
            this.model.selectedRegisters = [];

            const isUnary = ['INC', 'DEC', 'ROL', 'ROR', 'NOT'].includes(opName);
            if (isUnary) {
                console.log('Operación unaria seleccionada. Selecciona un registro destino.');
                this.model.setState(GameState.SELECT_REGISTER_LAST);
            } else {
                const isIntel = this.model.isIntelBinaryOrder();
                if (isIntel) {
                    console.log('Operación binaria seleccionada. Orden Intel: selecciona el registro destino primero.');
                } else {
                    console.log('Operación binaria seleccionada. Orden GNU: selecciona el registro origen primero.');
                }
                this.model.setState(GameState.SELECT_REGISTER_INITIAL);
            }
        }

        this.syncBoard();
    }

    handleRegisterSelected(regName) {
        if (this.isInteractionBlocked()) return;

        console.log(`Clic en registro: ${regName}`);

        if (this.model.disabledRegisters.has(regName)) {
            console.log(`El registro ${regName} está deshabilitado por un evento.`);
            if (this.model.pendingRepairCard) {
                this.model.repairError('register', regName);
                this.syncBoard();
            }
            return;
        }

        if (!this.model.selectedOperation) return;

        const isUnary = ['INC', 'DEC', 'ROL', 'ROR', 'NOT'].includes(this.model.selectedOperation);
        const isIntel = this.model.isIntelBinaryOrder();

        if (this.model.state === GameState.SELECT_REGISTER_INITIAL) {
            this.model.selectedRegisters.push(regName);
            if (isIntel) {
                console.log(`Registro destino seleccionado primero (Intel): ${regName}`);
            } else {
                console.log(`Registro origen seleccionado primero (GNU): ${regName}`);
            }
            this.model.setState(GameState.SELECT_REGISTER_LAST);
            this.syncBoard();
            return;
        }

        if (this.model.state === GameState.SELECT_REGISTER_LAST) {
            this.model.selectedRegisters.push(regName);

            // Intel: primer click = destino, segundo = origen
            // GNU:   primer click = origen, segundo = destino
            let targetReg, sourceReg;
            if (isUnary) {
                targetReg = this.model.selectedRegisters[0];
                sourceReg = null;
                console.log(`Registro destino seleccionado (Unario): ${regName}`);
            } else if (isIntel) {
                targetReg = this.model.selectedRegisters[0];
                sourceReg = this.model.selectedRegisters[1];
                console.log(`Registro origen seleccionado segundo (Intel): ${regName}`);
            } else {
                sourceReg = this.model.selectedRegisters[0];
                targetReg = this.model.selectedRegisters[1];
                console.log(`Registro destino seleccionado segundo (GNU): ${regName}`);
            }

            const op = this.model.selectedOperation;

            // MOV no puede aplicarse al mismo registro (src === dest no tiene efecto)
            if (op === 'MOV' && targetReg === sourceReg) {
                console.log('MOV: src y dest son el mismo registro. Selecciona un registro diferente.');
                this.model.selectedRegisters.pop(); // Revert el push
                this.syncBoard();
                return;
            }

            console.log(`Aplicando ${op} al Destino: ${targetReg} (Origen: ${sourceReg})`);

            const currentTargetVal = this.model.registers[targetReg];
            const currentSourceVal = sourceReg ? this.model.registers[sourceReg] : 0;
            const newVal = OperationEngine.execute(op, currentTargetVal, currentSourceVal);
            const cost = this.model.getEnergyCost(op);

            // Bloquear interacción durante animación (antes de emitir ENERGY_UPDATED)
            this.model.setState(GameState.ANIMATING);
            this.model.registers[targetReg] = newVal;
            this.model.updateEnergy(cost); // ENERGY_UPDATED bloqueado por ANIMATING guard
            this.model.selectedOperation = null;
            this.model.selectedRegisters = [];

            // Animar bits del registro destino con la misma animación del inicio
            this.board.animateRegisterUpdate(targetReg, newVal).then(() => {
                this.model.setState(GameState.SELECT_OPERATION);
                this.syncBoard();
                setTimeout(() => this.model.checkWinCondition(), 50);
            });
        }
    }

}

