export class SceneCustom extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Estado
        this.energy = 3.0;
        this.initRegistersCount = 3;
        this.binaryOpsOrder = 'gnu';
        this.selectedEventIndices = new Set();
        this.selectedOps = new Set(['inc', 'dec', 'rol', 'ror', 'mov', 'not', 'or', 'and', 'xor']);
        this.currentTab = 'MISC';

        // Datos fijos
        this.allEvents = [
            'evento-reset_ax', 'evento-reset_bx', 'evento-reset_cx', 'evento-reset_dx',
            'evento-reset_value1', 'evento-reset_value2', 'evento-reset_value3',
            'evento-error_bx', 'evento-error_cx', 'evento-error_dx',
            'evento-error_rol', 'evento-error_xor', 'evento-error_not',
            'evento-bug', 'evento-bug', 'evento-bug',
            'evento-ok', 'evento-ok', 'evento-ok', 'evento-ok',
        ];
        // Grid 7 cols: fila1=7 resets | fila2=[empty]+6 errors | fila3=3 bugs+4 oks
        this.allOps = [
            'inc', 'add', 'rol', 'mov', 'or', 'and', 'xor',
            'dec', 'sub', 'ror', 'not', 'nor', 'nand', 'xnor',
        ];
    }

    init(data, router) {
        this.router = router;
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
    }

    // ── Helpers de texturas ───────────────────────────────────────────────────

    _opTexture(op) {
        const unary = ['inc', 'dec', 'rol', 'ror', 'not'];
        return `assets/texture/game/op-${unary.includes(op) ? '1' : '2'}-${op}.png`;
    }

    _opColor(op) {
        if (['inc', 'dec', 'add', 'sub'].includes(op)) return 'green';
        if (['rol', 'ror'].includes(op)) return 'yellow';
        if (op === 'mov') return 'pink';
        if (['or', 'and', 'xor'].includes(op)) return 'red';
        return 'white'; // not, nor, nand, xnor
    }

    _evColor(ev) {
        if (ev === 'evento-bug') return 'yellow';
        if (ev === 'evento-ok') return 'green';
        if (ev.startsWith('evento-error_')) return 'red';
        return 'white'; // reset_*
    }

    // ── Constructores de HTML ────────────────────────────────────────────────

    _batteryHtml() {
        // Llena de derecha (índice 3) a izquierda (índice 0), igual que MoonBoard
        const bats = [];
        let remaining = this.energy;
        for (let i = 3; i >= 0; i--) {
            let src;
            if (remaining >= 1) { src = 'bat.png'; remaining -= 1; }
            else if (remaining >= 0.5) { src = 'bat-half.png'; remaining -= 0.5; }
            else { src = 'bat-empty.png'; }
            bats[i] = `<img class="ctrl-icon" data-bat="${i}" src="assets/texture/game/${src}" draggable="false">`;
        }
        return bats.join('');
    }

    _regHtml() {
        // regIdx 0=D (mat-register-3), 1=C (mat-register-2), 2=B (mat-register-1)
        // Activo cuando initRegistersCount >= threshold (3, 2, 1)
        return [0, 1, 2].map(regIdx => {
            const matIdx = 3 - regIdx;
            const threshold = 3 - regIdx;
            const active = this.initRegistersCount >= threshold;
            return `
                <div class="reg-wrap">
                    <img class="ctrl-icon" src="assets/texture/game/mat-register-${matIdx}.png" draggable="false">
                    <img class="reg-overlay" data-reg="${regIdx}"
                         src="assets/texture/game/color-white-selected.png"
                         style="opacity:${active ? 1 : 0}" draggable="false">
                </div>`;
        }).join('');
    }

    _eventsHtml() {
        const cells = [];
        this.allEvents.forEach((evKey, cardIdx) => {
            if (evKey === 'evento-error_bx') {
                cells.push(`<img class="cell-empty" src="assets/texture/menu_setup/emty_square.png" draggable="false">`);
            }
            const color = this._evColor(evKey);
            const selected = this.selectedEventIndices.has(cardIdx);
            cells.push(`
                <div class="grid-cell" data-event-idx="${cardIdx}">
                    <img class="card-bg"  src="assets/texture/game/color-${color}-border.png" draggable="false">
                    <img class="card-img" src="assets/texture/game/${evKey}.png" draggable="false">
                    <img class="card-overlay${selected ? ' visible' : ''}"
                         src="assets/texture/game/color-${color}-selected.png" draggable="false">
                </div>`);
        });
        return cells.join('');
    }

    _opsHtml() {
        return this.allOps.map(op => {
            const color = this._opColor(op);
            const selected = this.selectedOps.has(op);
            return `
                <div class="grid-cell" data-op="${op}">
                    <img class="card-bg"  src="assets/texture/game/color-${color}-border.png" draggable="false">
                    <img class="card-img" src="${this._opTexture(op)}" draggable="false">
                    <img class="card-overlay${selected ? ' visible' : ''}"
                         src="assets/texture/game/color-${color}-selected.png" draggable="false">
                </div>`;
        }).join('');
    }

    _opsOrderRowHtml() {
        const isGnu = this.binaryOpsOrder === 'gnu';
        if (isGnu) {
            return `
                <img class="ops-order-item" src="assets/texture/menu_setup/src_selected.png" draggable="false">
                <img class="ops-order-item" src="assets/texture/menu_setup/right.png" draggable="false">
                <img class="ops-order-item" src="assets/texture/menu_setup/dest.png" draggable="false">
            `;
        }
        return `
            <img class="ops-order-item" src="assets/texture/menu_setup/dest.png" draggable="false">
            <img class="ops-order-item" src="assets/texture/menu_setup/left.png" draggable="false">
            <img class="ops-order-item" src="assets/texture/menu_setup/src_selected.png" draggable="false">
        `;
    }

    _toggleBinaryOpsOrder() {
        this.binaryOpsOrder = this.binaryOpsOrder === 'gnu' ? 'intel' : 'gnu';
        const row = this.shadowRoot.getElementById('ops-order-row');
        if (row) {
            row.innerHTML = this._opsOrderRowHtml();
            this._setupOpsOrderRowEvents();
        }
    }

    _setupOpsOrderRowEvents() {
        this.shadowRoot.querySelectorAll('.ops-order-item').forEach(el => {
            el.addEventListener('pointerdown', () => this._toggleBinaryOpsOrder());
        });
    }

    // ── Render ───────────────────────────────────────────────────────────────

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    background: url('assets/texture/game/mat-empty.png') center/100% 100% no-repeat;
                    position: relative;
                    overflow: hidden;
                }
                .layout {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    padding: 0 min(3.5vw, 5vh);

                    padding: 0 min(3.5dvw, 5dvh);
                    box-sizing: border-box;
                }
                /* ── Columna de tabs ── */
                .tabs {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: min(1.2vw, 1.8vh);
                    width: calc(min(9.375vw, 16.667vh) * 1.85);

                    gap: min(1.2dvw, 1.8dvh);
                    width: calc(min(9.375dvw, 16.667dvh) * 1.85);

                    flex-shrink: 0;
                }
                .tab-btn {
                    width: calc(min(9.375vw, 16.667vh) * 1.3);
                    height: calc(min(9.375vw, 16.667vh) * 1.3);

                    width: calc(min(9.375dvw, 16.667dvh) * 1.3);
                    height: calc(min(9.375dvw, 16.667dvh) * 1.3);
                    max-width: 100%;
                    max-height: 100%;
                    cursor: pointer;
                    display: block;
                    object-fit: fill;
                    flex-shrink: 0;
                    transition: transform 0.1s;
                    touch-action: manipulation;
                    -webkit-user-drag: none;
                }
                .tab-btn:hover { transform: scale(1.07); }

                .tabs-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: min(1.2vw, 1.8vh);

                    gap: min(1.2dvw, 1.8dvh);
                    flex-shrink: 0;
                }

                .moon-title {
                    width: calc(min(9.375vw, 16.667vh) * 1.85);

                    width: calc(min(9.375dvw, 16.667dvh) * 1.85);
                    height: auto;
                    object-fit: contain;
                    display: block;
                    -webkit-user-drag: none;
                }

                /* ── Área de contenido ── */
                .content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    min-width: 0;
                    overflow: hidden;
                }
                .page {
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: calc(min(9.375vw, 16.667vh) * 0.45);

                    gap: calc(min(9.375dvw, 16.667dvh) * 0.45);
                    width: 100%;
                }
                .page.active { display: flex; }

                /* ── MISC ── */
                .ctrl-row {
                    display: flex;
                    align-items: center;
                    gap: min(1.2vw, 1.8vh);

                    gap: min(1.2dvw, 1.8dvh);
                }
                .ctrl-icon {
                    width: min(9.375vw, 16.667vh);
                    height: min(9.375vw, 16.667vh);
                    
                    width: min(9.375dvw, 16.667dvh);
                    height: min(9.375dvw, 16.667dvh);
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: fill;
                    display: block;
                    flex-shrink: 0;
                    -webkit-user-drag: none;
                }
                .ctrl-btn {
                    width: min(9.375vw, 16.667vh);
                    height: min(9.375vw, 16.667vh);

                    width: min(9.375dvw, 16.667dvh);
                    height: min(9.375dvw, 16.667dvh);
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: fill;
                    cursor: pointer;
                    display: block;
                    flex-shrink: 0;
                    transition: transform 0.1s;
                    -webkit-user-drag: none;
                }
                .ctrl-btn:hover  { transform: scale(1.1); }
                .ctrl-btn:active { transform: scale(0.93); }

                /* Contenedor de registro con overlay absoluto */
                .reg-wrap {
                    position: relative;
                    width: min(9.375vw, 16.667vh);
                    height: min(9.375vw, 16.667vh);
                    
                    width: min(9.375dvw, 16.667dvh);
                    height: min(9.375dvw, 16.667dvh);
                    flex-shrink: 0;
                }
                .reg-wrap > img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: fill;
                    display: block;
                    -webkit-user-drag: none;
                }
                .reg-overlay {
                    transition: opacity 0.2s ease;
                    pointer-events: none;
                }

                /* ── Grids ── */
                .grid {
                    display: grid;
                    grid-template-columns: repeat(7, min(9.375vw, 16.667vh));
                    gap: min(1.2vw, 1.8vh);

                    grid-template-columns: repeat(7, min(9.375dvw, 16.667dvh));
                    gap: min(1.2dvw, 1.8dvh);
                }
                .grid-cell {
                    position: relative;
                    width: min(9.375vw, 16.667vh);
                    height: min(9.375vw, 16.667vh);
                    
                    width: min(9.375dvw, 16.667dvh);
                    height: min(9.375dvw, 16.667dvh);
                    cursor: pointer;
                    overflow: hidden;
                    transition: transform 0.1s;
                }
                .grid-cell:hover { transform: scale(1.07); z-index: 1; }
                .card-bg {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: fill;
                    display: block;
                    z-index: 0;
                    -webkit-user-drag: none;
                }
                .card-img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: fill;
                    display: block;
                    z-index: 2;
                    -webkit-user-drag: none;
                }
                .card-overlay {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: fill;
                    z-index: 1;
                    opacity: 0;
                    transition: opacity 0.18s ease;
                    pointer-events: none;
                    -webkit-user-drag: none;
                }
                .card-overlay.visible { opacity: 1; }
                .cell-empty {
                    display: block;
                    width: min(9.375vw, 16.667vh);
                    height: min(9.375vw, 16.667vh);

                    width: min(9.375dvw, 16.667dvh);
                    height: min(9.375dvw, 16.667dvh);
                    object-fit: fill;
                    flex-shrink: 0;
                    -webkit-user-drag: none;
                }

                /* ── OPS: fila de orden de operandos ── */
                .ops-grid-wrap {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: min(1.2vw, 1.8vh);

                    gap: min(1.2dvw, 1.8dvh);
                }
                .ops-order-row {
                    display: flex;
                    align-items: center;
                    gap: min(1.2vw, 1.8vh);

                    gap: min(1.2dvw, 1.8dvh);
                }
                .ops-order-item {
                    width: min(9.375vw, 16.667vh);
                    height: min(9.375vw, 16.667vh);
                    
                    width: min(9.375dvw, 16.667dvh);
                    height: min(9.375dvw, 16.667dvh);
                    cursor: pointer;
                    display: block;
                    object-fit: contain;
                    flex-shrink: 0;
                    transition: transform 0.1s;
                    -webkit-user-drag: none;
                }
                .ops-order-item:hover  { transform: scale(1.07); }
                .ops-order-item:active { transform: scale(0.95); }

                /* ── Botones de navegación ── */
                .nav-buttons {
                    position: absolute;
                    bottom: min(2.5vw, 3.8vh);
                    right: min(2.5vw, 3.8vh);

                    bottom: min(2.5dvw, 3.8dvh);
                    right: min(2.5dvw, 3.8dvh);
                    display: flex;
                    gap: min(1.2vw, 1.8vh);

                    gap: min(1.2dvw, 1.8dvh);
                }
                .nav-btn {
                    width: calc(min(9.375vw, 16.667vh) * 1.35);
                    height: calc(min(9.375vw, 16.667vh) * 1.35);

                    width: calc(min(9.375dvw, 16.667dvh) * 1.35);
                    height: calc(min(9.375dvw, 16.667dvh) * 1.35);
                    max-width: 100%;
                    max-height: 100%;
                    cursor: pointer;
                    display: block;
                    object-fit: fill;
                    flex-shrink: 0;
                    transition: transform 0.1s, opacity 0.1s;
                    -webkit-user-drag: none;
                }
                .nav-btn:hover  { opacity: 0.85; transform: scale(1.1); }
                .nav-btn:active { transform: scale(0.92); }
                #back-btn { transform: rotate(-90deg); }
                #back-btn:hover  { opacity: 0.85; transform: rotate(-90deg) scale(1.1); }
                #back-btn:active { transform: rotate(-90deg) scale(0.92); }
            </style>

            <div class="layout">

                <!-- Columna de tabs -->
                <div class="tabs-wrapper">
                    <img
                        class="moon-title"
                        src="assets/texture/game/setup-title.png"
                        alt="Moon Title"
                        draggable="false"
                    >

                    <div class="tabs">
                        <img class="tab-btn" id="tab-misc"   src="assets/texture/menu_setup/tab_misc_selected.png"   data-tab="MISC"   draggable="false">
                        <img class="tab-btn" id="tab-events" src="assets/texture/menu_setup/tab_events.png"           data-tab="EVENTS" draggable="false">
                        <img class="tab-btn" id="tab-ops"    src="assets/texture/menu_setup/tab_ops.png"              data-tab="OPS"    draggable="false">
                    </div>

                </div>

                <!-- Área de contenido -->
                <div class="content">

                    <!-- ── MISC ── -->
                    <div class="page active" id="page-misc">
                        <div class="ctrl-row" id="energy-row">
                            <img class="ctrl-icon" src="assets/texture/game/bat.png" draggable="false">
                            <img class="ctrl-btn"  id="energy-plus"  src="assets/texture/menu_setup/plus_sign.png"  draggable="false">
                            ${this._batteryHtml()}
                            <img class="ctrl-btn"  id="energy-minus" src="assets/texture/menu_setup/minus_sign.png" draggable="false">
                        </div>
                        <div class="ctrl-row" id="reg-row">
                            <img class="ctrl-icon" src="assets/texture/menu_setup/misc_init.png" draggable="false">
                            <img class="ctrl-btn"  id="reg-plus"  src="assets/texture/menu_setup/plus_sign.png"  draggable="false">
                            <img class="cell-empty" src="assets/texture/menu_setup/emty_square.png" draggable="false">
                            ${this._regHtml()}
                            <img class="ctrl-btn"  id="reg-minus" src="assets/texture/menu_setup/minus_sign.png" draggable="false">
                        </div>
                    </div>

                    <!-- ── EVENTS ── -->
                    <div class="page" id="page-events">
                        <div class="grid" id="events-grid">
                            ${this._eventsHtml()}
                        </div>
                    </div>

                    <!-- ── OPS ── -->
                    <div class="page" id="page-ops">
                        <div class="ops-grid-wrap">
                            <div class="grid" id="ops-grid">
                                ${this._opsHtml()}
                            </div>
                            <div class="ops-order-row" id="ops-order-row">
                                ${this._opsOrderRowHtml()}
                            </div>
                        </div>
                    </div>

                    <!-- Botones de navegación -->
                    <div class="nav-buttons">
                        <img class="nav-btn" id="back-btn" src="assets/texture/menu_setup/play.png" draggable="false" alt="Back">
                        <img class="nav-btn" id="play-btn" src="assets/texture/menu_setup/play.png" draggable="false" alt="Play">
                    </div>
                </div>
            </div>
        `;
    }

    // ── Eventos ──────────────────────────────────────────────────────────────

    setupEvents() {
        const sr = this.shadowRoot;

        // Tabs
        sr.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('pointerdown', () => this._switchTab(btn.dataset.tab));
        });

        // Energía
        sr.getElementById('energy-plus').addEventListener('pointerdown', () => {
            this.energy = Math.min(4.0, parseFloat((this.energy + 0.5).toFixed(1)));
            this._updateBatteryDisplay();
        });
        sr.getElementById('energy-minus').addEventListener('pointerdown', () => {
            this.energy = Math.max(0.5, parseFloat((this.energy - 0.5).toFixed(1)));
            this._updateBatteryDisplay();
        });

        // Registros
        sr.getElementById('reg-plus').addEventListener('pointerdown', () => {
            this.initRegistersCount = Math.min(3, this.initRegistersCount + 1);
            this._updateRegDisplay();
        });
        sr.getElementById('reg-minus').addEventListener('pointerdown', () => {
            this.initRegistersCount = Math.max(0, this.initRegistersCount - 1);
            this._updateRegDisplay();
        });

        // Grid eventos
        sr.querySelectorAll('[data-event-idx]').forEach(cell => {
            cell.addEventListener('pointerdown', () => {
                const idx = parseInt(cell.dataset.eventIdx, 10);
                if (this.selectedEventIndices.has(idx)) {
                    this.selectedEventIndices.delete(idx);
                } else {
                    this.selectedEventIndices.add(idx);
                }
                const overlay = cell.querySelector('.card-overlay');
                if (overlay) overlay.classList.toggle('visible', this.selectedEventIndices.has(idx));
            });
        });

        // Grid ops
        sr.querySelectorAll('[data-op]').forEach(cell => {
            cell.addEventListener('pointerdown', () => {
                const op = cell.dataset.op;
                if (this.selectedOps.has(op)) {
                    if (this.selectedOps.size > 1) this.selectedOps.delete(op);
                } else {
                    this.selectedOps.add(op);
                }
                const overlay = cell.querySelector('.card-overlay');
                if (overlay) overlay.classList.toggle('visible', this.selectedOps.has(op));
            });
        });

        // Orden de operandos
        this._setupOpsOrderRowEvents();

        // Navegación
        sr.getElementById('back-btn').addEventListener('pointerdown', () => {
            this.router.navigate('menu');
        });
        sr.getElementById('play-btn').addEventListener('pointerdown', () => {
            this._startGame();
        });
    }

    // ── Actualizaciones de UI ────────────────────────────────────────────────

    _switchTab(tab) {
        this.currentTab = tab;
        const keys = { MISC: 'tab_misc', EVENTS: 'tab_events', OPS: 'tab_ops' };
        const sr = this.shadowRoot;
        ['MISC', 'EVENTS', 'OPS'].forEach(t => {
            const btn = sr.getElementById(`tab-${t.toLowerCase()}`);
            const page = sr.getElementById(`page-${t.toLowerCase()}`);
            const active = t === tab;
            if (btn) btn.src = `assets/texture/menu_setup/${keys[t]}${active ? '_selected' : ''}.png`;
            if (page) page.classList.toggle('active', active);
        });
    }

    _updateBatteryDisplay() {
        let remaining = this.energy;
        for (let i = 3; i >= 0; i--) {
            const el = this.shadowRoot.querySelector(`[data-bat="${i}"]`);
            if (!el) continue;
            let src;
            if (remaining >= 1) { src = 'bat.png'; remaining -= 1; }
            else if (remaining >= 0.5) { src = 'bat-half.png'; remaining -= 0.5; }
            else { src = 'bat-empty.png'; }
            el.src = `assets/texture/game/${src}`;
        }
    }

    _updateRegDisplay() {
        [0, 1, 2].forEach(regIdx => {
            const el = this.shadowRoot.querySelector(`[data-reg="${regIdx}"]`);
            if (!el) return;
            const threshold = 3 - regIdx;
            el.style.opacity = this.initRegistersCount >= threshold ? '1' : '0';
        });
    }

    // ── Arrancar partida ─────────────────────────────────────────────────────

    _startGame() {
        const selectedEventKeys = this.allEvents.filter((_, idx) => this.selectedEventIndices.has(idx));
        const selectedOpKeys = [...this.selectedOps].map(k => k.toUpperCase());

        this.router.navigate('game', {
            difficulty: 'CUSTOM',
            customConfig: {
                energy: this.energy,
                initialRegistersCount: this.initRegistersCount,
                selectedEventKeys,
                selectedOpKeys,
                binaryOpsOrder: this.binaryOpsOrder,
            },
        });
    }
}

customElements.define('scene-custom', SceneCustom);
