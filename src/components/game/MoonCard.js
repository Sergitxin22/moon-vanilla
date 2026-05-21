import { gameEvents } from '../../core/EventEmitter.js';

export class MoonCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.operation = 'INC';
        this.disabled = false;
        this.color = null;
    }

    static get observedAttributes() {
        return ['operation', 'disabled', 'selected', 'color'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'operation') this.operation = newValue;
        if (name === 'disabled') this.disabled = newValue === 'true';
        if (name === 'selected') this.selected = newValue === 'true';
        if (name === 'color') this.color = newValue;
        this.render();
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
    }

    setupEvents() {
        this.shadowRoot.addEventListener('pointerdown', () => {
            if (!this.disabled && this.operation !== 'OP') {
                gameEvents.emit('OPERATION_CLICKED', this.operation);
            }
        });
    }

    getCardImage() {
        if (this.operation === 'OP') {
            return 'assets/texture/game/mat-op-slot.png';
        }
        const unaries = ['INC', 'DEC', 'ROL', 'ROR', 'NOT'];
        const numParams = unaries.includes(this.operation) ? '1' : '2';
        return `assets/texture/game/op-${numParams}-${this.operation.toLowerCase()}.png`;
    }

    render() {
        const imgSrc = this.getCardImage();

        // Reconstruir sólo si la operación cambió (la primera vez siempre construimos)
        if (!this._rendered || this._renderedOp !== this.operation) {
            this._renderedOp = this.operation;
            this._rendered = true;
            this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        display: block;
                        width: var(--sz, 110px);
                        height: var(--sz, 110px);
                        cursor: pointer;
                        position: relative;
                        transition: opacity 0.15s;
                    }
                    :host([disabled="true"]) {
                        pointer-events: none;
                    }
                    .card {
                        display: block;
                        width: var(--sz, 110px);
                        height: var(--sz, 110px);
                        object-fit: contain;
                        transition: transform 0.2s;
                        position: relative;
                        z-index: 1;
                    }
                    .highlight {
                        position: absolute;
                        top: 0; left: 0;
                        width: 100%; height: 100%;
                        object-fit: contain;
                        z-index: 0;
                        opacity: 0;
                        transition: opacity 0.5s ease-out;
                        pointer-events: none;
                    }
                    .highlight.visible {
                        opacity: 1;
                    }
                    :host(:active) .card {
                        transform: translateY(2px) scale(0.95);
                    }
                </style>
                <img class="highlight" draggable="false" alt="highlight">
                <img class="card" src="${imgSrc}" draggable="false" alt="${this.operation}" onerror="this.src='assets/texture/game/mat-op-slot.png'">
            `;
        }

        // Actualizar highlight sin tocar el resto del DOM
        // El highlight es visible siempre que la carta sea accesible (color set),
        // y con opacidad completa solo cuando está seleccionada.
        const highlightEl = this.shadowRoot.querySelector('.highlight');
        if (highlightEl) {
            if (this.color) {
                const newSrc = `assets/texture/game/color-${this.color}-selected.png`;
                if (highlightEl.getAttribute('data-src') !== newSrc) {
                    highlightEl.src = newSrc;
                    highlightEl.setAttribute('data-src', newSrc);
                }
                highlightEl.classList.add('visible');
                if (this.selected) highlightEl.classList.add('selected-state');
                else highlightEl.classList.remove('selected-state');
            } else {
                highlightEl.classList.remove('visible', 'selected-state');
            }
        }
    }

    animateFadeIn() {
        // Fade-in del highlight de disponibilidad (selected-state no aplica aqui)
        const highlightEl = this.shadowRoot.querySelector('.highlight');
        if (!highlightEl) return;
        const color = this.color || 'white';
        const src = `assets/texture/game/color-${color}-selected.png`;
        highlightEl.src = src;
        highlightEl.setAttribute('data-src', src);
        highlightEl.classList.remove('visible', 'selected-state');
        // Forzar reflow para que el navegador registre opacity=0 antes de la transición
        highlightEl.offsetHeight;
        highlightEl.classList.add('visible');
    }
}

customElements.define('moon-card', MoonCard);
