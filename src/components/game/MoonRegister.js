import { OperationEngine } from '../../model/OperationEngine.js';
import { gameEvents } from '../../core/EventEmitter.js';

export class MoonRegister extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.name = 'A';
        this.value = 0;
        this.disabled = false;
    }

    static get observedAttributes() {
        return ['name', 'value', 'disabled', 'highlight-color', 'highlight-fill', 'startup-value', 'startup-phase', 'startup-delay'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'name') this.name = newValue;
        if (name === 'value') this.value = parseInt(newValue) || 0;
        if (name === 'disabled') this.disabled = newValue === 'true';
        if (name === 'highlight-color') this.highlightColor = newValue;
        if (name === 'highlight-fill') this.highlightFill = newValue === 'true';
        if (name === 'startup-value') this.startupValue = parseInt(newValue) || 0;
        if (name === 'startup-phase') this.startupPhase = newValue;
        if (name === 'startup-delay') this.startupDelay = parseInt(newValue) || 0;
        this.render();
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
    }

    setupEvents() {
        this.shadowRoot.addEventListener('pointerdown', () => {
            if (!this.disabled) {
                gameEvents.emit('REGISTER_CLICKED', this.name);
            }
        });
    }

    render() {
        const phase = this.startupPhase; // 'show' | 'bits' | 'hide' | null
        const regIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[this.name] ?? 0;

        // Valor y animación de bits según fase
        let bitsValue, animateBits, bitsDelay;
        if (phase === 'show') {
            bitsValue = this.value;         // bits actuales (0 al inicio)
            animateBits = false;
        } else if (phase === 'bits') {
            bitsValue = this.startupValue;  // valor del registro a mostrar
            animateBits = true;
        } else if (phase === 'bits-only') {
            // Como 'bits' pero SIN mostrar la carta (para animateRegisterUpdate tras operación)
            bitsValue = this.startupValue;
            animateBits = true;
        } else if (phase === 'hide') {
            bitsValue = this.startupValue;  // mantener bits visibles
            animateBits = false;
        } else {
            // Normal o cleanup: si startup-value todavía está definido, usárlo para no flashear bits a 0
            bitsValue = this.startupValue || this.value;
            animateBits = false;
        }

        const binaryStr = (bitsValue || 0).toString(2).padStart(4, '0');
        const bits = binaryStr.split('');
        // La imagen de la carta siempre muestra el valor real del registro (no el valor de los bits en pantalla)
        const cardBinaryStr = (this.startupValue || 0).toString(2).padStart(4, '0');

        const bitsHtml = bits.map((bit, index) => {
            let animStyle = '';
            if (animateBits && bit === '1') {
                // De derecha a izquierda: LSB (index 3) delay base del registro + 0ms, MSB (index 0) delay base + 300ms
                const baseDelay = this.startupDelay ?? 0;
                const delay = `${baseDelay + (bits.length - 1 - index) * 100}ms`;
                animStyle = `opacity: 0; animation: explodeIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay} both;`;
            } else {
                animStyle = `transition: opacity 0.2s; opacity: ${bit === '1' ? '1' : '0'};`;
            }
            return `
            <div class="bit-container">
                <img class="bit" src="assets/texture/game/bit0.png" draggable="false" alt="0">
                <img class="bit overlay" src="assets/texture/game/bit1.png" style="${animStyle}" draggable="false" alt="1">
            </div>
            `;
        }).join('');

        const borderHtml = this.highlightColor ? `<img class="border" src="assets/texture/game/color-${this.highlightColor}-border.png">` : '';
        // Fill solo cuando el registro ha sido seleccionado para la operación (highlight-fill)
        const fillHtml = (this.highlightColor && this.highlightFill) ? `<img class="fill" src="assets/texture/game/color-${this.highlightColor}-selected.png">` : '';

        // setup-card: CSS de animación según fase
        // 'bits-only' no muestra carta: solo anima los bits del registro
        let setupCardHtml = '';
        let setupCardCssAnim = '';
        if (phase === 'show') {
            setupCardCssAnim = 'animation: popIn 1.0s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;';
            setupCardHtml = `<img class="setup-card" src="assets/texture/game/objetivo-${cardBinaryStr}.png" draggable="false">`;
        } else if (phase === 'bits') {
            setupCardCssAnim = 'animation: none; transform: scale(1); opacity: 1;';
            setupCardHtml = `<img class="setup-card" src="assets/texture/game/objetivo-${cardBinaryStr}.png" draggable="false">`;
        } else if (phase === 'hide') {
            setupCardCssAnim = 'animation: popOut 1.0s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards;';
            setupCardHtml = `<img class="setup-card" src="assets/texture/game/objetivo-${cardBinaryStr}.png" draggable="false">`;
        }
        // 'bits-only': setupCardHtml y setupCardCssAnim quedan vacíos → no se renderiza la carta

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: var(--sz, 110px);
                    cursor: pointer;
                    opacity: ${this.disabled ? '0.3' : '1'};
                    pointer-events: ${this.disabled ? 'none' : 'auto'};
                }
                .container {
                    display: flex;
                    align-items: center;
                    gap: var(--gp, 15px); /* centerGapX = 15 */
                    position: relative;
                }
                .bg-wrapper {
                    position: relative;
                    width: var(--sz, 110px);
                    height: var(--sz, 110px);
                }
                .bg {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    position: relative;
                    z-index: 2;
                }
                .setup-card {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    z-index: 10;
                    transform-origin: center center;
                    ${setupCardCssAnim}
                }
                .border, .fill {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    object-fit: contain;
                    z-index: 3;
                    pointer-events: none;
                }
                .fill { z-index: 1; opacity: 0.5; }
                .bits {
                    display: flex;
                    gap: var(--gp, 15px); /* centerGapX = 15 */
                }
                .bit-container {
                    position: relative;
                    width: var(--sz, 110px);
                    height: var(--sz, 110px);
                }
                .bit {
                    position: absolute;
                    top: 0; left: 0;
                    display: block;
                    width: 100%; 
                    height: 100%; 
                    object-fit: contain;
                }
                .overlay {
                    transition: opacity 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                @keyframes popIn { 
                    from { transform: scale(0); opacity: 0; } 
                    to { transform: scale(1); opacity: 1; } 
                }
                @keyframes popOut { 
                    from { transform: scale(1); opacity: 1; } 
                    to { transform: scale(0); opacity: 0; } 
                }
                @keyframes explodeIn { 
                    from { transform: scale(0); opacity: 0; } 
                    to { transform: scale(1); opacity: 1; } 
                }
            </style>
            <div class="container">
                <div class="bg-wrapper">
                    ${setupCardHtml}
                    ${fillHtml}
                    <img class="bg" src="assets/texture/game/mat-register-${regIndex}.png" draggable="false" alt="Registro ${this.name}">
                    ${borderHtml}
                </div>
                <div class="bits">${bitsHtml}</div>
            </div>
        `;
    }
}

customElements.define('moon-register', MoonRegister);
