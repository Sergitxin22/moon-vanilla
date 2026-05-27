import './MoonRegister.js';
import './MoonCard.js';
import { gameEvents } from '../../core/EventEmitter.js';

export class MoonBoard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Estado virtual del componente
        this.registers = { A: 0, B: 0, C: 0, D: 0 };
        this.energy = 0;
        this.operations = ['INC', 'DEC', 'ROL', 'ROR', 'AND'];
    }

    connectedCallback() {
        this.render();
        this.setupSubscriptions();
    }

    disconnectedCallback() {
        // En una app real debemos dessebscribirnos (off) para evitar memory leaks
        gameEvents.off('STATE_CHANGED', this.onStateChanged);
        gameEvents.off('ENERGY_UPDATED', this.onEnergyUpdated);
        // ...
    }

    setupSubscriptions() {
        this.onEnergyUpdated = (energy) => {
            this.updateEnergy(energy);
        };
        gameEvents.on('ENERGY_UPDATED', this.onEnergyUpdated);
    }

    render() {
        // Generar operaciones (2 columnas)
        const activeOps = ['INC', 'DEC', 'ROL', 'ROR', 'MOV', 'NOT', 'OR', 'AND', 'XOR']; // Puedes usar this.operations en un caso real
        const cardsHtml = Array.from({ length: 10 }).map((_, i) => {
            const op = activeOps[i] || 'OP'; // Filler 'OP'
            return `<moon-card operation="${op}"></moon-card>`;
        }).join('');

        // Igual que Phaser: D arriba, A abajo (A es el registro objetivo, el que hay que igualar)
        const regOrder = ['D', 'C', 'B', 'A'];
        console.log('[MoonBoard] render() regOrder:', regOrder);
        const registersHtml = regOrder.map(name => `
            <moon-register name="${name}" value="${this.registers[name] || 0}"></moon-register>
        `).join('');

        // Generar Slots (Baraja/Mazo) 6 rows, arriba el 5 y abajo el 0
        const slotsHtml = Array.from({ length: 6 }).map((_, i) => {
            const slotIndex = 5 - i;
            return `<img src="assets/texture/game/mat-obj-slot-${slotIndex}.png" class="slot" draggable="false">`;
        }).join('');

        // Baterías
        let energyLeft = this.energy;
        const maxEnergy = Math.ceil(parseFloat(this.getAttribute('max-energy') || '4'));

        const batteries = [];
        for (let i = 0; i < maxEnergy; i++) {
            let img = 'bat-empty.png';
            if (energyLeft >= 1) { img = 'bat.png'; energyLeft -= 1; }
            else if (energyLeft > 0) { img = 'bat-half.png'; energyLeft = 0; }
            batteries.push(`<img src="assets/texture/game/${img}" class="center-sprite" draggable="false">`);
        }
        // Para que se vacíen de izquierda a derecha, revertimos la lista
        batteries.reverse();
        const batteriesHtml = batteries.join('');

        // Headers
        const headersHtml = `
            <img src="assets/texture/game/mat-bit-value-3.png" class="center-sprite" draggable="false">
            <img src="assets/texture/game/mat-bit-value-2.png" class="center-sprite" draggable="false">
            <img src="assets/texture/game/mat-bit-value-1.png" class="center-sprite" draggable="false">
            <img src="assets/texture/game/mat-bit-value-0.png" class="center-sprite" draggable="false">
        `;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    /* Variables maestras de escalado responsive */
                    --sz: min(9vw, 14vh);
                    --gp: min(1.2vw, 1.8vh);
                    
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%; 
                    height: 100%;
                    background: url('assets/texture/game/mat-empty.png') center/100% 100% no-repeat;
                    box-sizing: border-box;
                }

                /* Contenedor principal que agrupa los 3 paneles */
                .board-wrapper {
                    display: flex;
                    justify-content: space-between; /* Los separa al máximo disponible */
                    align-items: flex-end; /* Alinea los 3 por la parte inferior */
                    width: 100%;
                    padding: 0 min(4vw, 50px); /* Margen responsivo para monitores grandes y pequeños */
                    box-sizing: border-box;
                }

                /* Panel izquierdo (Operaciones) */
                .operations-panel {
                    display: grid;
                    grid-template-columns: repeat(2, var(--sz));
                    gap: var(--gp); /* Mismo gap en elementos */
                    justify-content: center;
                }
                moon-card {
                    display: block;
                    width: var(--sz);
                    height: var(--sz);
                }

                /* Panel derecho (Slots) */
                .slots-panel {
                    display: grid;
                    grid-template-columns: var(--sz);
                    gap: var(--gp); /* Mismo gap en elementos */
                    justify-content: center;
                }
                .slot {
                    display: block;
                    width: var(--sz);
                    height: var(--sz);
                    object-fit: contain;
                }

                /* Panel central (Registros y Energía) */
                .center-panel {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--gp); /* Mismo gap en elementos */
                }
                moon-register {
                    display: block;
                    height: var(--sz);
                }
                
                .center-row-energy {
                    display: flex;
                    gap: var(--gp);
                    justify-content: flex-end;
                    width: 100%;
                }
                .center-row-headers {
                    display: flex;
                    gap: var(--gp);
                }

                .center-sprite {
                    display: block;
                    width: var(--sz);
                    height: var(--sz);
                    object-fit: contain;
                }
                
                #btn-home {
                    cursor: pointer;
                    transition: transform 0.1s;
                }
                #btn-home:active {
                    transform: scale(0.9);
                }
            </style>
            
            <div class="board-wrapper">
                <div class="operations-panel">
                    ${cardsHtml}
                </div>

                <div class="center-panel">
                    <!-- Fila Baterías -->
                    <div class="center-row-energy">
                        ${batteriesHtml}
                    </div>
                    <!-- Fila Cabeceras numéricas -->
                    <div class="center-row-headers">
                        <img id="btn-home" src="assets/texture/menu_return.png" class="center-sprite" alt="Return" draggable="false">
                        ${headersHtml}
                    </div>
                    <!-- Filas Registros D, C, B, A -->
                    ${registersHtml}
                </div>

                <div class="slots-panel">
                    ${slotsHtml}
                </div>
            </div>
        `;

        // Asignar evento al botón de volver (ahora integrado en el tablero)
        const btnHome = this.shadowRoot.getElementById('btn-home');
        if (btnHome) {
            btnHome.addEventListener('pointerdown', () => {
                const event = new CustomEvent('return-menu', { bubbles: true, composed: true });
                this.dispatchEvent(event);
            });
        }
    }

    // Métodos para ser llamados desde el Controlador y repintar lo necesario
    async animateStartupSequence(order, registers) {
        // Retardos base por registro, igual que el original Phaser:
        // B (rowIdx=2): baseDelay=0ms, C (rowIdx=1): 600ms, D (rowIdx=0): 1200ms
        const baseDelays = { 'B': 0, 'C': 600, 'D': 1200 };

        // 1. Todas las cartas aparecen simultáneamente (Back.easeOut, 1000ms)
        order.forEach(name => {
            const regEl = this.shadowRoot.querySelector(`moon-register[name="${name}"]`);
            if (!regEl) return;
            regEl.setAttribute('startup-value', registers[name]);
            regEl.setAttribute('startup-delay', baseDelays[name] ?? 0);
            regEl.setAttribute('startup-phase', 'show');
        });
        // Esperar a que termine el popIn (1000ms)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Bits de todos los registros simultáneamente (cada uno con su delay base codificado)
        //    B bits: 0ms, C bits: 600ms, D bits: 1200ms desde este momento
        order.forEach(name => {
            const regEl = this.shadowRoot.querySelector(`moon-register[name="${name}"]`);
            if (!regEl) return;
            regEl.setAttribute('startup-phase', 'bits');
        });
        // Esperar 2000ms visible (igual que delayedCall(2000) del original)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3. Todas las cartas desaparecen simultáneamente (Back.easeIn, 1000ms)
        order.forEach(name => {
            const regEl = this.shadowRoot.querySelector(`moon-register[name="${name}"]`);
            if (!regEl) return;
            regEl.setAttribute('startup-phase', 'hide');
        });
        // Esperar a que termine el popOut (1000ms + buffer)
        await new Promise(resolve => setTimeout(resolve, 1100));

        // 4. Limpiar sin flashear: quitar fase primero, luego value, luego startup-value
        order.forEach(name => {
            const regEl = this.shadowRoot.querySelector(`moon-register[name="${name}"]`);
            if (!regEl) return;
            regEl.removeAttribute('startup-phase');           // render: sin carta, bits usan startupValue
            regEl.setAttribute('value', registers[name]);    // render: bits usan startupValue (correcto)
            regEl.removeAttribute('startup-value');           // render: startupValue=0, bits usan value (correcto)
            regEl.removeAttribute('startup-delay');
        });
    }

    async animateInitialRegister(name, value) {
        const regEl = this.shadowRoot.querySelector(`moon-register[name="${name}"]`);
        if (regEl) {
            regEl.setAttribute('startup-value', value);
            regEl.setAttribute('value', value);
            // Esperar el tiempo exacto que duran nuestras animaciones en MoonRegister.js
            // 0.5s (popIn) + 0.7s (espera) + 0.3s (popOut) = 1.5s total de la carta
            // Los bits empiezan a aparecer escalonados a partir del 1.0s hasta 1.6s
            await new Promise(resolve => setTimeout(resolve, 2000));
            regEl.removeAttribute('startup-value');
        }
    }

    updateRegisters(regs) {
        this.registers = regs;
        Object.keys(regs).forEach(name => {
            const regEl = this.shadowRoot.querySelector(`moon-register[name="${name}"]`);
            if (regEl) {
                regEl.setAttribute('value', regs[name]);
            }
        });
    }

    updateEnergy(energyValue) {
        this.energy = energyValue;

        // Overlay blanco (color-white-selected) en slot 5 + cursor cuando se puede robar
        const maxEnergy = Math.ceil(parseFloat(this.getAttribute('max-energy') || '4'));
        const canSteal = energyValue < maxEnergy;
        const deckSlotEl = this.shadowRoot.querySelector('.deck-slot');
        if (deckSlotEl) deckSlotEl.classList.toggle('can-steal', canSteal);
        const overlayEl = this.shadowRoot.querySelector('.slot5-overlay');
        if (overlayEl) overlayEl.classList.toggle('visible', canSteal);

        const container = this.shadowRoot.querySelector('.center-row-energy');
        if (!container) return;

        let energyLeft = this.energy;
        const batteries = [];
        for (let i = 0; i < maxEnergy; i++) {
            const threshold = maxEnergy - 1 - i;
            if (this.energy > threshold) {
                let diff = this.energy - threshold;
                if (diff >= 1) batteries.push('bat.png');
                else batteries.push('bat-half.png');
            } else {
                batteries.push('bat-empty.png');
            }
        }

        container.innerHTML = batteries.map(img => `<img src="assets/texture/game/${img}" class="center-sprite" draggable="false" style="animation: pop 0.3s ease-out;">`).join('');
    }

    _getOpColor(opType) {
        const OP_GROUPS_BY_COLOR = {
            green: ['INC', 'DEC', 'ADD', 'SUB'],
            yellow: ['ROL', 'ROR'],
            pink: ['MOV'],
            red: ['OR', 'AND', 'XOR'],
            white: ['NOT', 'NOR', 'NAND', 'XNOR'],
        };
        for (const [col, ops] of Object.entries(OP_GROUPS_BY_COLOR)) {
            if (ops.includes(opType)) return col;
        }
        return 'white';
    }

    animateOperationHighlights(model) {
        // Igual que animateOperationHighlights de Phaser: fade-in simultáneo de los disponibles
        const cards = this.shadowRoot.querySelectorAll('moon-card');
        cards.forEach(card => {
            const opType = card.getAttribute('operation');
            if (!opType || opType === 'OP') return;
            const isDisabled = model.disabledOperations && model.disabledOperations.has(opType);
            const cost = model.getEnergyCost ? model.getEnergyCost(opType) : 1;
            const canAfford = !isDisabled && model.energy >= cost;
            if (isDisabled || !canAfford) {
                card.setAttribute('disabled', 'true');
                card.removeAttribute('color');
            } else {
                card.removeAttribute('disabled');
                // Disparar fade-in del highlight de color
                const color = this._getOpColor(opType);
                card.setAttribute('color', color);
                card.animateFadeIn && card.animateFadeIn();
            }
        });
    }

    updateOperationHighlights(model) {
        if (model.state === 'ANIMATING') return;
        const hasSelectedOp = !!model.selectedOperation;
        const cards = this.shadowRoot.querySelectorAll('moon-card');
        const ERROR_OP_TEXTURES = { ROL: 'evento-error_rol', XOR: 'evento-error_xor', NOT: 'evento-error_not' };

        cards.forEach(card => {
            const opType = card.getAttribute('operation');
            if (opType === 'OP') return;

            const isErrorDisabled = model.disabledOperations && model.disabledOperations.has(opType);
            const cost = model.getEnergyCost ? model.getEnergyCost(opType) : 1;
            const isEnergyDisabled = !isErrorDisabled && model.energy < cost;

            if (isErrorDisabled) {
                card.setAttribute('disabled', 'true');
                card.removeAttribute('selected');
                card.removeAttribute('color');
                const errorTex = ERROR_OP_TEXTURES[opType];
                if (errorTex) card.setAttribute('error', errorTex);
                else card.removeAttribute('error');
            } else if (isEnergyDisabled) {
                card.setAttribute('disabled', 'true');
                card.removeAttribute('selected');
                card.removeAttribute('color');
                card.removeAttribute('error');
            } else {
                card.removeAttribute('disabled');
                card.removeAttribute('error');
                if (hasSelectedOp) {
                    if (model.selectedOperation === opType) {
                        // Operación seleccionada: color propio + estado selected
                        card.setAttribute('color', this._getOpColor(opType));
                        card.setAttribute('selected', 'true');
                    } else {
                        // Otra operación está seleccionada: sin color
                        card.removeAttribute('color');
                        card.removeAttribute('selected');
                    }
                } else {
                    // Sin selección: todas las disponibles muestran su color
                    card.setAttribute('color', this._getOpColor(opType));
                    card.removeAttribute('selected');
                }
            }
        });
    }

    updateRegisterHighlights(model) {
        const regs = this.shadowRoot.querySelectorAll('moon-register');
        const ERROR_REG_TEXTURES = { B: 'evento-error_bx', C: 'evento-error_cx', D: 'evento-error_dx' };

        // Bloqueos de eventos
        regs.forEach(reg => {
            const regName = reg.getAttribute('name');
            if (model.disabledRegisters && model.disabledRegisters.has(regName)) {
                reg.setAttribute('disabled', 'true');
                const errorTex = ERROR_REG_TEXTURES[regName];
                if (errorTex) reg.setAttribute('error', errorTex);
                else reg.removeAttribute('error');
            } else {
                reg.removeAttribute('disabled');
                reg.removeAttribute('error');
            }
        });

        // Highlight por operación: SOLO borde en todos, fill en los ya seleccionados
        if (model.selectedOperation) {
            const color = this._getOpColor(model.selectedOperation);
            const selectedRegs = new Set(model.selectedRegisters || []);
            regs.forEach(reg => {
                if (!reg.hasAttribute('disabled')) {
                    reg.setAttribute('highlight-color', color);
                    if (selectedRegs.has(reg.getAttribute('name'))) {
                        reg.setAttribute('highlight-fill', 'true');
                    } else {
                        reg.removeAttribute('highlight-fill');
                    }
                }
            });
        } else {
            regs.forEach(reg => {
                reg.removeAttribute('highlight-color');
                reg.removeAttribute('highlight-fill');
            });
        }
    }

    // Reemplaza las operaciones mostradas en el panel izquierdo.
    // Llamar desde AppController antes de playStartupSequence().
    setAvailableOps(ops) {
        const panel = this.shadowRoot.querySelector('.operations-panel');
        if (!panel) return;
        const html = Array.from({ length: 10 }).map((_, i) => {
            const op = ops[i] || 'OP';
            return `<moon-card operation="${op}"></moon-card>`;
        }).join('');
        panel.innerHTML = html;
    }

    updateSlots(drawnCards, model) {
        let container = this.shadowRoot.querySelector('.slots-panel');
        if (!container || !drawnCards) return;

        // Crear estructura fija solo una vez
        if (!container.querySelector('.fixed-slots')) {
            const fixedHtml = Array.from({ length: 6 }).map((_, i) => {
                const slotIndex = 5 - i;
                const cls = slotIndex === 5 ? 'slot-bg deck-slot' : 'slot-bg';
                return `<img src="assets/texture/game/mat-obj-slot-${slotIndex}.png" class="${cls}" draggable="false">`;
            }).join('');
            container.innerHTML = `
                <style>
                    .slots-panel { position: relative; }
                    /* fixed-slots necesita position:relative para el overlay absoluto */
                    .fixed-slots { position: relative; }
                    .slot-bg { display: block; width: var(--sz); height: var(--sz); object-fit: contain; margin-bottom: var(--gp); }
                    .slot-bg:last-child { margin-bottom: 0; }
                    /* Cursor pointer solo cuando se puede robar */
                    .deck-slot.can-steal { cursor: pointer; }
                    /* Overlay con la textura original 'color-white-selected' sobre el slot 5 */
                    .slot5-overlay {
                        position: absolute;
                        top: 0; left: 0;
                        width: var(--sz); height: var(--sz);
                        object-fit: contain;
                        opacity: 0;
                        transition: opacity 0.4s ease;
                        pointer-events: none;
                        z-index: 3;
                    }
                    .slot5-overlay.visible { opacity: 0.65; }
                    /* Subir opacidad en hover solo cuando puede robar (sibling selector funciona porque deck-slot precede al overlay en el DOM) */
                    .deck-slot.can-steal:hover ~ .slot5-overlay { opacity: 1 !important; }
                    /* dynamic-cards: capa absoluta sobre todo el panel de slots */
                    .dynamic-cards { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
                    .flowing-card {
                        position: absolute; left: 0;
                        width: var(--sz); height: var(--sz);
                        transition: top 0.35s ease-in-out, opacity 0.35s ease-out, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        z-index: 10;
                    }
                    .flowing-card > img {
                        position: absolute;
                        top: 0; left: 0;
                        width: 100%; height: 100%;
                        object-fit: contain;
                        pointer-events: none;
                    }
                    .flowing-card > .card-bd {
                        z-index: 0;
                        opacity: 0;
                    }
                    .flowing-card.has-backdrop > .card-bd {
                        opacity: 1;
                    }
                    .flowing-card > .card-img {
                        z-index: 1;
                    }
                    .flowing-card.bug-ghost {
                        pointer-events: auto;
                    }
                    .flowing-card.instant { transition: none !important; }
                    .deck-glow { animation: glow-breathe 1s infinite alternate; }
                    @keyframes glow-breathe {
                        from { filter: drop-shadow(0 0 5px rgba(255,255,255,0.2)); }
                        to   { filter: drop-shadow(0 0 15px rgba(255,255,255,0.8)); transform: scale(1.02); }
                    }
                </style>
                <div class="fixed-slots">
                    ${fixedHtml}
                    <img class="slot5-overlay" src="assets/texture/game/color-white-selected.png" draggable="false">
                </div>
                <div class="dynamic-cards"></div>
            `;

            // Click en slot 5 (mazo) para robar carta
            container.querySelector('.deck-slot')?.addEventListener('pointerdown', () => {
                gameEvents.emit('DECK_CLICKED');
            });

            // Delegación de clicks en slots BUG bloqueados
            container.querySelector('.dynamic-cards')?.addEventListener('pointerdown', (e) => {
                const bugGhost = e.target.closest?.('.bug-ghost');
                if (bugGhost) {
                    const bugId = parseInt(bugGhost.getAttribute('data-bug-id'));
                    gameEvents.emit('BUG_SLOT_CLICKED', { bugId });
                }
            });
        }

        const dynamicContainer = container.querySelector('.dynamic-cards');
        const deckSlot = container.querySelector('.deck-slot');

        // Mapa de texturas de eventos
        const EVENT_TEXTURES = {
            BUG: 'evento-bug',
            ERROR_OP_ROL: 'evento-error_rol', ERROR_OP_XOR: 'evento-error_xor', ERROR_OP_NOT: 'evento-error_not',
            ERROR_REG_B: 'evento-error_bx', ERROR_REG_C: 'evento-error_cx', ERROR_REG_D: 'evento-error_dx',
            RESET_REG_A: 'evento-reset_ax', RESET_REG_B: 'evento-reset_bx', RESET_REG_C: 'evento-reset_cx', RESET_REG_D: 'evento-reset_dx',
            RESET_BIT_1: 'evento-reset_value1', RESET_BIT_2: 'evento-reset_value2', RESET_BIT_3: 'evento-reset_value3',
            OK: 'evento-ok',
        };
        const getEventBackdropColor = (eventType) => {
            if (eventType === 'BUG') return 'yellow';
            if (eventType === 'OK') return 'green';
            if (eventType && eventType.startsWith('ERROR_')) return 'red';
            if (eventType && eventType.startsWith('RESET_')) return 'white';
            return null;
        };

        // Info de slots bloqueados y reparación pendiente
        const numBlocked = model ? model.blockedSlots.size : 0;
        const blockedIds = model ? [...model.blockedSlots] : [];
        const hasPendingRepair = model ? !!model.pendingRepairCard : false;

        if (drawnCards.length === 0 && numBlocked === 0) {
            dynamicContainer.innerHTML = '';
            deckSlot?.classList.add('deck-glow');
            return;
        }

        deckSlot.classList.remove('deck-glow');

        // Helper: ruta de imagen de una carta (cara visible)
        const getImgSrc = (card, isActive) => {
            if (!isActive) return 'assets/texture/game/back.png';
            if (card.kind === 'objective') return `assets/texture/game/objetivo-${card.value.toString(2).padStart(4, '0')}.png`;
            if (card.kind === 'event') return `assets/texture/game/${EVENT_TEXTURES[card.eventType] || 'evento-bug'}.png`;
            return '';
        };

        // Animación de volteo horizontal (scaleX 1→0→1), igual que el original Phaser
        const flipToFace = (el, card) => {
            const faceSrc = getImgSrc(card, true);
            if (!faceSrc) return;
            const cardImg = el.querySelector ? el.querySelector('.card-img') : null;
            if (!cardImg) return;
            el.style.transition = 'transform 250ms linear';
            el.style.transform = 'scaleX(0)';
            setTimeout(() => {
                cardImg.src = faceSrc;
                // Activar fondo de color para eventos
                if (card.kind === 'event') {
                    const color = getEventBackdropColor(card.eventType);
                    if (color) {
                        const bdImg = el.querySelector('.card-bd');
                        if (bdImg) bdImg.src = `assets/texture/game/color-${color}-selected.png`;
                        el.classList.add('has-backdrop');
                    }
                }
                el.style.transform = 'scaleX(1)';
                setTimeout(() => {
                    el.style.transition = '';
                    el.style.transform = 'scale(1)';
                }, 260);
            }, 260);
        };

        // Generar HTML de slots BUG bloqueados (encima de las cartas normales)
        const bugGhostsHtml = blockedIds.map((bugId, j) => {
            const top = `calc(${j + 1} * (var(--sz) + var(--gp)))`;
            const cursor = hasPendingRepair ? 'cursor:pointer;' : 'cursor:default;';
            return `<div class="flowing-card bug-ghost instant has-backdrop" data-bug-id="${bugId}" style="top:${top}; opacity:1; transform:scale(1); ${cursor}">
                <img class="card-bd" src="assets/texture/game/color-yellow-selected.png" draggable="false">
                <img class="card-img" src="assets/texture/game/evento-bug.png" draggable="false">
            </div>`;
        }).join('');

        // Detectar si se robó una carta nueva del mazo (drawnCards[length-1] cambió)
        const currentTopCard = drawnCards.length > 0 ? drawnCards[drawnCards.length - 1] : null;
        const isNewTopCard = currentTopCard !== this._prevTopCard;
        this._prevTopCard = currentTopCard;

        // Detectar si la carta activa (drawnCards[0]) cambió: init o completó objetivo
        const currentActiveCard = drawnCards[0] || null;
        const isNewActiveCard = currentActiveCard !== this._prevActiveCard;
        this._prevActiveCard = currentActiveCard;

        if (isNewTopCard && drawnCards.length > 0) {
            // Animación simultánea: nueva carta desde el mazo, existentes bajan un slot
            const totalNew = drawnCards.length;
            const totalOld = totalNew - 1;

            const initialHtml = bugGhostsHtml + drawnCards.map((card, i) => {
                const isNewCard = (i === totalNew - 1);
                const isActive = (i === 0);

                if (isNewCard) {
                    const imgSrc = getImgSrc(card, false); // reverso
                    return `<div class="flowing-card instant" style="top:0; opacity:0; transform:scale(0);" data-target="${numBlocked + 1}"${isActive ? ' data-active="true"' : ''}>
                        <img class="card-bd" src="" draggable="false">
                        <img class="card-img" src="${imgSrc}" draggable="false">
                    </div>`;
                } else {
                    const imgSrc = getImgSrc(card, isActive);
                    const oldVisualIndex = numBlocked + totalOld - 1 - i;
                    const newVisualIndex = numBlocked + totalNew - 1 - i;
                    const oldTop = `calc(${oldVisualIndex + 1} * (var(--sz) + var(--gp)))`;
                    const isEvent = isActive && card.kind === 'event';
                    const backdropColor = isEvent ? getEventBackdropColor(card.eventType) : null;
                    const bdSrc = backdropColor ? `assets/texture/game/color-${backdropColor}-selected.png` : '';
                    const hasBackdropClass = backdropColor ? ' has-backdrop' : '';
                    return `<div class="flowing-card instant${hasBackdropClass}" style="top:${oldTop}; opacity:1; transform:scale(1);" data-target="${newVisualIndex + 1}"${isActive ? ' data-active="true"' : ''}>
                        <img class="card-bd" src="${bdSrc}" draggable="false">
                        <img class="card-img" src="${imgSrc}" draggable="false">
                    </div>`;
                }
            }).join('');

            dynamicContainer.innerHTML = initialHtml;
            dynamicContainer.offsetHeight;

            dynamicContainer.querySelectorAll('.flowing-card').forEach(el => {
                const target = el.getAttribute('data-target');
                if (!target) return; // BUG ghosts no tienen data-target
                el.classList.remove('instant');
                el.style.top = `calc(${target} * (var(--sz) + var(--gp)))`;
                el.style.opacity = '1';
                el.style.transform = 'scale(1)';
            });

            // Tras el deslizamiento: voltear la carta activa si es nueva (caso init)
            if (isNewActiveCard) {
                const activeEl = dynamicContainer.querySelector('[data-active="true"]');
                if (activeEl) {
                    let flipped = false;
                    const triggerFlip = () => {
                        if (flipped) return;
                        flipped = true;
                        flipToFace(activeEl, drawnCards[0]);
                    };
                    const onSlideEnd = (e) => {
                        if (e.propertyName === 'transform') {
                            activeEl.removeEventListener('transitionend', onSlideEnd);
                            triggerFlip();
                        }
                    };
                    activeEl.addEventListener('transitionend', onSlideEnd);
                    setTimeout(triggerFlip, 650); // fallback por si transitionend no llega
                }
            }
        } else {
            // Sin nueva carta robada: actualizar posiciones instantáneamente
            // Si la carta activa cambió (objetivo completado → siguiente), mostrar reverso y voltear
            const html = bugGhostsHtml + drawnCards.map((card, i) => {
                const isActive = (i === 0);
                const visualIndex = numBlocked + drawnCards.length - 1 - i;
                const top = `calc(${visualIndex + 1} * (var(--sz) + var(--gp)))`;
                const showBack = isActive && isNewActiveCard;
                const imgSrc = showBack ? 'assets/texture/game/back.png' : getImgSrc(card, isActive);
                const isEvent = !showBack && isActive && card.kind === 'event';
                const backdropColor = isEvent ? getEventBackdropColor(card.eventType) : null;
                const bdSrc = backdropColor ? `assets/texture/game/color-${backdropColor}-selected.png` : '';
                const hasBackdropClass = backdropColor ? ' has-backdrop' : '';
                return `<div class="flowing-card instant${hasBackdropClass}" style="top:${top}; opacity:1; transform:scale(1);"${isActive ? ' data-active="true"' : ''}>
                    <img class="card-bd" src="${bdSrc}" draggable="false">
                    <img class="card-img" src="${imgSrc}" draggable="false">
                </div>`;
            }).join('');
            dynamicContainer.innerHTML = html;

            if (isNewActiveCard && drawnCards.length > 0) {
                dynamicContainer.offsetHeight; // registrar posición con .instant
                const activeEl = dynamicContainer.querySelector('[data-active="true"]');
                if (activeEl) {
                    activeEl.classList.remove('instant'); // activar transiciones antes del flip
                    dynamicContainer.offsetHeight; // segundo reflow para que el browser registre el cambio
                    setTimeout(() => flipToFace(activeEl, drawnCards[0]), 20);
                }
            }
        }
    }
    // Anima la carta activa hacia fuera (scale→0, opacity→0, 300ms) y llama callback al terminar.
    // Equivale al tween de removeCompletedObjective en Phaser (alpha:0, scaleX:0, scaleY:0, duration:300).
    animateObjectiveExit(callback) {
        const dynamicContainer = this.shadowRoot.querySelector('.dynamic-cards');
        const activeEl = dynamicContainer ? dynamicContainer.querySelector('[data-active="true"]') : null;
        if (activeEl) {
            activeEl.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            activeEl.style.transform = 'scale(0)';
            activeEl.style.opacity = '0';
            setTimeout(() => {
                // Eliminar el elemento del DOM antes de que updateSlots reconstruya el contenedor
                activeEl.remove();
                callback();
            }, 300);
        } else {
            callback();
        }
    }
    // Anima los bits de un registro con la misma animación explodeIn del inicio (sin mostrar la carta de objetivo)
    async animateRegisterUpdate(name, value) {
        const regEl = this.shadowRoot.querySelector(`moon-register[name="${name}"]`);
        if (!regEl) return;
        regEl.setAttribute('startup-value', value);
        regEl.setAttribute('startup-delay', '0');
        regEl.setAttribute('startup-phase', 'bits-only');  // Solo bits, sin carta
        // Máximo: 3 bits * 100ms stagger + 400ms duración = 700ms + buffer
        await new Promise(resolve => setTimeout(resolve, 750));
        regEl.removeAttribute('startup-phase');
        regEl.setAttribute('value', value);
        regEl.removeAttribute('startup-value');
        regEl.removeAttribute('startup-delay');
    }

}

customElements.define('moon-board', MoonBoard);
