const EVENT_BASE_TEXTURES = {
    'evento-bug': { selected: 'color-yellow-selected', border: 'color-yellow-border' },
    'evento-ok': { selected: 'color-green-selected', border: 'color-green-border' },
};

const OP_GROUP_BY_COLOR = {
    green: ['inc', 'dec', 'add', 'sub'],
    yellow: ['rol', 'ror'],
    pink: ['mov'],
    red: ['or', 'and', 'xor'],
    white: ['not', 'nor', 'nand', 'xnor'],
};

export default class CustomScene extends Phaser.Scene {
    constructor() {
        super('CustomScene');
    }

    create() {
        // --- Estado inicial ---
        this.energy = 3.0; // Energía por defecto
        this.initRegistersCount = 3; // Por defecto: D, C y B
        this.binaryOpsOrder = 'gnu'; // src -> dst por defecto (sintaxis GNU)
        // Eventos seleccionados inicialmente (por clave de textura)
        const defaultSelectedEventKeys = new Set();

        // Operaciones seleccionadas por defecto (mínimo 1, máximo 10)
        this.selectedOps = new Set([
            'inc', 'dec', 'rol', 'ror', 'mov', 'not', 'or', 'and', 'xor'
        ]);

        // Listas auxiliares para construir la cuadrícula
        this.allEvents = [
            'evento-reset_ax', 'evento-reset_bx', 'evento-reset_cx', 'evento-reset_dx', 'evento-reset_value1', 'evento-reset_value2', 'evento-reset_value3',
            'evento-error_bx', 'evento-error_cx', 'evento-error_dx', 'evento-error_rol', 'evento-error_xor', 'evento-error_not',
            'evento-bug', 'evento-bug', 'evento-bug',
            'evento-ok', 'evento-ok', 'evento-ok', 'evento-ok'
        ];

        this.selectedEventCardIndices = new Set();
        const defaultSingleSelectLimits = {
            'evento-bug': 1,
            'evento-ok': 1,
        };
        const defaultSelectedByKeyCounter = {};
        this.allEvents.forEach((evKey, cardIndex) => {
            if (!defaultSelectedEventKeys.has(evKey)) return;

            const limit = defaultSingleSelectLimits[evKey];
            if (limit === undefined) {
                this.selectedEventCardIndices.add(cardIndex);
                return;
            }

            const currentCount = defaultSelectedByKeyCounter[evKey] || 0;
            if (currentCount < limit) {
                this.selectedEventCardIndices.add(cardIndex);
                defaultSelectedByKeyCounter[evKey] = currentCount + 1;
            }
        });

        this.allOps = [
            'inc', 'add', 'rol', 'mov', 'or', 'and', 'xor',
            'dec', 'sub', 'ror', 'not', 'nor', 'nand', 'xnor'
        ];

        // --- Distribución visual ---
        const { width, height } = this.scale;
        const scaleX = width / 1280;
        const scaleY = height / 720;
        this.scaleFactor = Math.min(scaleX, scaleY);
        const sf = this.scaleFactor;

        // Fondo
        const bg = this.add.image(width / 2, height / 2, 'cust-bg');
        const bgScale = Math.max(width / bg.width, height / bg.height);
        bg.setScale(bgScale);

        // Pestañas del lateral izquierdo
        const tabX = 170 * sf;
        const tabStartY = 230 * sf;
        const tabGap = 180 * sf;

        this.tabs = {};
        this.pages = {};

        // Pestaña: MISC
        this.tabs['MISC'] = this.createTab(tabX, tabStartY + 0 * tabGap, 'cust-tab-misc', 'cust-tab-misc-sel', () => this.switchPage('MISC'));
        // Pestaña: EVENTOS
        this.tabs['EVENTS'] = this.createTab(tabX, tabStartY + 1 * tabGap, 'cust-tab-events', 'cust-tab-events-sel', () => this.switchPage('EVENTS'));
        // Pestaña: OPS
        this.tabs['OPS'] = this.createTab(tabX, tabStartY + 2 * tabGap, 'cust-tab-ops', 'cust-tab-ops-sel', () => this.switchPage('OPS'));

        // Contenedor de páginas (lado derecho)
        this.pageContainer = this.add.container(0, 0);

        // -- Construcción de páginas --
        this.createMiscPage(width, height);
        this.createEventsPage(width, height);
        this.createOpsPage(width, height);

        // Botones de navegación (abajo a la derecha)
        const btnMargin = 120 * sf;
        const navBtnSize = 100 * sf;
        const navBtnSpacing = 120 * sf;

        // Botón de jugar
        const playBtn = this.add.image(width - btnMargin + (10 * sf), height - btnMargin + (20 * sf), 'cust-play');
        this.setupButton(playBtn, navBtnSize, navBtnSize);
        playBtn.on('pointerdown', () => this.startGame());

        // Botón de volver
        const backBtn = this.add.image(width - btnMargin - navBtnSpacing + (10 * sf), height - btnMargin + (20 * sf), 'cust-play'); // Reutiliza la textura de play rotada
        this.setupButton(backBtn, navBtnSize, navBtnSize);
        backBtn.setAngle(-90); // Orientado hacia arriba
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));


        // Página inicial
        this.switchPage('MISC');
    }

    setupButton(btn, w, h, enableHoverScale = true) {
        btn.setDisplaySize(w, h);
        btn.setInteractive({ useHandCursor: true });
        if (enableHoverScale) {
            const originalScaleX = btn.scaleX;
            const originalScaleY = btn.scaleY;
            btn.on('pointerover', () => btn.setScale(originalScaleX * 1.05, originalScaleY * 1.05));
            btn.on('pointerout', () => btn.setScale(originalScaleX, originalScaleY));
        }
        return btn;
    }

    setupHoverScale(elements, hoverFactor = 1.05) {
        if (!elements || elements.length === 0) return;

        const baseScales = elements.map(element => ({
            element,
            scaleX: element.scaleX,
            scaleY: element.scaleY,
        }));

        const triggerElement = elements[0];
        triggerElement.on('pointerover', () => {
            baseScales.forEach(({ element, scaleX, scaleY }) => {
                element.setScale(scaleX * hoverFactor, scaleY * hoverFactor);
            });
        });

        triggerElement.on('pointerout', () => {
            baseScales.forEach(({ element, scaleX, scaleY }) => {
                element.setScale(scaleX, scaleY);
            });
        });
    }

    getRightPanelGridMetrics(width) {
        const sf = this.scaleFactor;
        const cols = 7;
        const leftX = 400 * sf;
        const rightX = width - 160 * sf;
        const gapX = ((rightX - leftX) / (cols - 1)) * 1.05;
        const gapY = 140 * sf;
        const cardSize = 120 * sf;

        return { cols, leftX, gapX, gapY, cardSize };
    }

    createTab(x, y, keyNormal, keySelected, callback) {
        const btn = this.add.image(x, y, keyNormal);
        // Ajuste de tamaño homogéneo para pestañas
        const tabSize = 160 * this.scaleFactor;
        this.setupButton(btn, tabSize, tabSize);
        btn.on('pointerdown', callback);
        return { btn, keyNormal, keySelected };
    }

    switchPage(pageKey) {
        // Actualiza el estado visual de pestañas
        Object.keys(this.tabs).forEach(k => {
            const t = this.tabs[k];
            t.btn.setTexture(k === pageKey ? t.keySelected : t.keyNormal);
        });

        // Muestra solo la página activa
        if (this.pages['MISC']) this.pages['MISC'].setVisible(pageKey === 'MISC');
        if (this.pages['EVENTS']) this.pages['EVENTS'].setVisible(pageKey === 'EVENTS');
        if (this.pages['OPS']) this.pages['OPS'].setVisible(pageKey === 'OPS');
    }

    createMiscPage(width, height) {
        const sf = this.scaleFactor;
        const container = this.add.container(0, 0);
        const centerX = width * 0.65;
        const rowGapY = 150 * sf;
        const startY = (height / 2) - (rowGapY / 2);

        // --- FILA 1: ENERGÍA ---
        const energyY = startY;

        // Visual de 4 ranuras de batería (energía máxima = 4), alineado al tamaño de `misc`
        this.energyIcons = [];
        const n = 4;
        const btbScaleFactor = 120;
        const miscIconSize = btbScaleFactor * sf; // mismo tamaño usado para cust-misc-init
        const batW = miscIconSize;
        const batH = miscIconSize;
        const gap = 20 * sf;
        const totalWidth = n * batW + (n - 1) * gap;
        const startX = centerX - totalWidth / 2 + batW / 2;

        // Coloca el botón + a una distancia equivalente al gap de batería
        const ePlusX = startX - (batW + gap);
        const ePlus = this.add.image(ePlusX, energyY + (20 * sf), 'cust-btn-plus');
        this.setupButton(ePlus, btbScaleFactor * sf, btbScaleFactor * sf);
        ePlus.on('pointerdown', () => {
            this.energy = Math.min(4.0, this.energy + 0.5);
            this.updateEnergyDisplay();
        });

        // Icono de batería completa a la izquierda del botón + (decorativo)
        // Se mantiene el mismo espaciado usado entre baterías
        const fullBatIcon = this.add.image(ePlusX - (batW + gap), energyY + (20 * sf), 'bat');
        fullBatIcon.setDisplaySize(batW, batH);
        container.add(fullBatIcon);

        for (let i = 0; i < n; i++) {
            const x = startX + i * (batW + gap);
            const bat = this.add.image(x, energyY + (20 * sf), 'bat-empty');
            bat.setDisplaySize(batW, batH);
            this.energyIcons.push(bat);
            container.add(bat);
        }

        // Botón - (a la derecha) manteniendo el mismo gap respecto a la última batería
        const eMinusX = startX + n * (batW + gap);
        const eMinus = this.add.image(eMinusX, energyY + (20 * sf), 'cust-btn-minus');
        this.setupButton(eMinus, btbScaleFactor * sf, btbScaleFactor * sf);
        eMinus.on('pointerdown', () => {
            this.energy = Math.max(0.5, this.energy - 0.5);
            this.updateEnergyDisplay();
        });

        container.add([ePlus, eMinus]);

        // --- FILA 2: REGISTROS INICIALES ---
        const regY = startY + rowGapY;

        // Icono de inicialización y controles de registros (mismo espaciado que energía)
        const nRegs = 3;
        const nSlots = nRegs + 1; // casilla decorativa + D, C y B
        const regSize = btbScaleFactor * sf; // mismo tamaño base que misc/batería
        const gapReg = 20 * sf;
        const totalRegsWidth = nSlots * regSize + (nSlots - 1) * gapReg;
        const regsStartX = centerX - totalRegsWidth / 2 + regSize / 2;

        // Coloca el botón + a una distancia equivalente al gap de registros
        const rPlusX = regsStartX - (regSize + gapReg);
        const rPlus = this.add.image(rPlusX, regY + (20 * sf), 'cust-btn-plus');
        this.setupButton(rPlus, btbScaleFactor * sf, btbScaleFactor * sf);
        rPlus.on('pointerdown', () => {
            this.initRegistersCount = Math.min(3, this.initRegistersCount + 1);
            this.updateRegDisplay();
        });

        // Icono de inicialización a la izquierda del botón + (decorativo)
        const initIcon = this.add.image(rPlusX - (regSize + gapReg), regY + (20 * sf), 'cust-misc-init');
        initIcon.setDisplaySize(regSize, regSize);
        container.add(initIcon);

        // Casilla vacía decorativa entre + y el registro D (no interactiva)
        const emptySquare = this.add.image(regsStartX, regY + (20 * sf), 'cust-square');
        emptySquare.setDisplaySize(regSize, regSize);
        container.add(emptySquare);

        this.regIcons = [];
        const regLabels = ['D', 'C', 'B'];

        for (let i = 0; i < nRegs; i++) {
            const x = regsStartX + (i + 1) * (regSize + gapReg);
            // Usa el índice del bucle para obtener la textura de registro (3,2,1)
            const regIndex = nRegs - i;
            const img = this.add.image(x, regY + (20 * sf), `mat-register-${regIndex}`);
            img.setDisplaySize(regSize, regSize);

            const selectedOverlay = this.add.image(x, regY + (20 * sf), 'color-white-selected');
            selectedOverlay.setDisplaySize(regSize, regSize);
            selectedOverlay.setVisible(false);

            this.regIcons.push({ img, selectedOverlay, label: regLabels[i], index: regIndex });
            container.add([img, selectedOverlay]);
        }

        const rMinusX = regsStartX + nSlots * (regSize + gapReg);
        const rMinus = this.add.image(rMinusX, regY + (20 * sf), 'cust-btn-minus');
        this.setupButton(rMinus, btbScaleFactor * sf, btbScaleFactor * sf);
        rMinus.on('pointerdown', () => {
            this.initRegistersCount = Math.max(0, this.initRegistersCount - 1);
            this.updateRegDisplay();
        });

        container.add([rPlus, rMinus]);

        this.pages['MISC'] = container;
        this.updateEnergyDisplay();
        this.updateRegDisplay();
    }

    updateEnergyDisplay() {
        // Representación visual de energía flotante (0.5 - 4.0)
        // 4 ranuras: batería completa = 1.0, media batería = 0.5

        // Reinicia todas las ranuras
        this.energyIcons.forEach(i => i.setTexture('bat-empty'));

        // Rellena de derecha a izquierda para mantener el orden visual esperado
        let remaining = this.energy; // ej. 2.5
        for (let i = this.energyIcons.length - 1; i >= 0; i--) {
            if (remaining >= 1) {
                this.energyIcons[i].setTexture('bat');
                remaining -= 1;
            } else if (remaining >= 0.5) {
                this.energyIcons[i].setTexture('bat-half');
                remaining -= 0.5;
            } else {
                this.energyIcons[i].setTexture('bat-empty');
            }
        }
    }

    updateRegDisplay() {
        // Define cuántos registros se activan desde la derecha.
        // 0: todos apagados.
        // 1: B (índice 2) encendido.
        // 2: C (índice 1) y B (índice 2) encendidos.
        // 3: D (índice 0), C (índice 1) y B (índice 2) encendidos.

        const activeCount = this.initRegistersCount;
        // Si activeCount es 1, solo B está activo.
        // B está en el índice 2 del array [D, C, B].
        // Si activeCount es 2, se activan C y B (índices 1 y 2).
        // Si activeCount es 3, se activan D, C y B (índices 0, 1 y 2).

        this.regIcons.forEach((obj, index) => {
            // Índice 0 -> D (requiere >= 3)
            // Índice 1 -> C (requiere >= 2)
            // Índice 2 -> B (requiere >= 1)
            const threshold = 3 - index;
            const isActive = activeCount >= threshold;

            if (obj.img) {
                obj.img.clearTint();
            }

            if (obj.selectedOverlay) {
                obj.selectedOverlay.setVisible(isActive);
            }
        });
    }

    getEventSelectedTexture(evKey) {
        const exact = EVENT_BASE_TEXTURES[evKey];
        if (exact) return exact.selected;
        if (evKey.startsWith('evento-error_')) return 'color-red-selected';
        if (evKey.startsWith('evento-reset_')) return 'color-white-selected';
        return 'color-white-selected';
    }

    getEventBorderTexture(evKey) {
        const exact = EVENT_BASE_TEXTURES[evKey];
        if (exact) return exact.border;
        if (evKey.startsWith('evento-error_')) return 'color-red-border';
        if (evKey.startsWith('evento-reset_')) return 'color-white-border';
        return 'color-white-border';
    }

    getOpColor(opKey) {
        if (OP_GROUP_BY_COLOR.green.includes(opKey)) return 'green';
        if (OP_GROUP_BY_COLOR.yellow.includes(opKey)) return 'yellow';
        if (OP_GROUP_BY_COLOR.pink.includes(opKey)) return 'pink';
        if (OP_GROUP_BY_COLOR.red.includes(opKey)) return 'red';
        if (OP_GROUP_BY_COLOR.white.includes(opKey)) return 'white';
        return 'white';
    }

    getOpSelectedTexture(opKey) {
        return `color-${this.getOpColor(opKey)}-selected`;
    }

    getOpBorderTexture(opKey) {
        return `color-${this.getOpColor(opKey)}-border`;
    }

    setOverlaySelectedState(overlay, isSelected, animated = false) {
        if (!overlay) return;

        this.tweens.killTweensOf(overlay);

        if (!animated) {
            overlay.setVisible(isSelected);
            overlay.setAlpha(isSelected ? 1 : 0);
            return;
        }

        if (isSelected) {
            overlay.setVisible(true);
            overlay.setAlpha(0);
            this.tweens.add({
                targets: overlay,
                alpha: 1,
                duration: 180,
                ease: 'Power2'
            });
            return;
        }

        this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 140,
            ease: 'Power2',
            onComplete: () => {
                overlay.setVisible(false);
            }
        });
    }

    createEventsPage(width, height) {
        const container = this.add.container(0, 0);
        container.setVisible(false);

        const { cols, leftX, gapX, gapY, cardSize } = this.getRightPanelGridMetrics(width);

        const eventGridItems = [];
        this.allEvents.forEach((evKey, cardIndex) => {
            if (evKey === 'evento-error_bx') {
                eventGridItems.push({ type: 'decorative-empty' });
            }
            eventGridItems.push({ type: 'event-card', evKey, cardIndex });
        });

        const eventRows = Math.ceil(eventGridItems.length / cols);
        const startY = (height / 2) - (((eventRows - 1) * gapY) / 2);

        eventGridItems.forEach((item, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = leftX + col * gapX;
            const y = startY + row * gapY;

            if (item.type === 'decorative-empty') {
                const decorativeSquare = this.add.image(x, y, 'cust-square');
                decorativeSquare.setDisplaySize(cardSize, cardSize);
                container.add(decorativeSquare);
                return;
            }

            const { evKey, cardIndex } = item;

            // Fondo de selección (casilla cuadrada)
            const bg = this.add.image(x, y, this.getEventBorderTexture(evKey));
            bg.setDisplaySize(cardSize, cardSize);

            const card = this.add.image(x, y, evKey);
            this.setupButton(card, cardSize, cardSize, false);

            const selectedOverlay = this.add.image(x, y, this.getEventSelectedTexture(evKey));
            selectedOverlay.setDisplaySize(cardSize, cardSize);
            selectedOverlay.setVisible(false);

            this.setupHoverScale([card, bg, selectedOverlay]);

            // Lógica de alternancia de selección
            const updateState = (animated = false) => {
                const isSelected = this.selectedEventCardIndices.has(cardIndex);
                bg.clearTint();
                card.setAlpha(1.0);
                this.setOverlaySelectedState(selectedOverlay, isSelected, animated);
            };

            card.on('pointerdown', () => {
                if (this.selectedEventCardIndices.has(cardIndex)) {
                    this.selectedEventCardIndices.delete(cardIndex);
                } else {
                    this.selectedEventCardIndices.add(cardIndex);
                }
                updateState(true);
            });

            // Estado inicial
            updateState(false);

            container.add([selectedOverlay, card, bg]);
        });

        this.pages['EVENTS'] = container;
    }

    createOpsPage(width, height) {
        const container = this.add.container(0, 0);
        container.setVisible(false);

        const { cols, leftX, gapX, gapY, cardSize } = this.getRightPanelGridMetrics(width);
        const opRows = Math.ceil(this.allOps.length / cols);
        const startY = (height / 2) - (((opRows - 1) * gapY) / 2);

        this.createOpsOrderDropdown(container, width, height);

        this.allOps.forEach((opKey, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = leftX + col * gapX;
            const y = startY + row * gapY;

            // Fondo (casilla cuadrada)
            const bg = this.add.image(x, y, this.getOpBorderTexture(opKey));
            bg.setDisplaySize(cardSize, cardSize);

            const card = this.add.image(x, y, opKey);
            this.setupButton(card, cardSize, cardSize, false);

            const selectedOverlay = this.add.image(x, y, this.getOpSelectedTexture(opKey));
            selectedOverlay.setDisplaySize(cardSize, cardSize);
            selectedOverlay.setVisible(false);

            this.setupHoverScale([card, bg, selectedOverlay]);

            const updateState = (animated = false) => {
                const isSelected = this.selectedOps.has(opKey);
                bg.clearTint();
                card.setAlpha(1.0);
                this.setOverlaySelectedState(selectedOverlay, isSelected, animated);
            };

            card.on('pointerdown', () => {
                if (this.selectedOps.has(opKey)) {
                    if (this.selectedOps.size > 1) {
                        this.selectedOps.delete(opKey);
                    }
                } else {
                    if (this.selectedOps.size < 10) {
                        this.selectedOps.add(opKey);
                    }
                }
                updateState(true);
            });

            updateState(false);
            // Orden de renderizado: selección, carta, borde
            container.add([selectedOverlay, card, bg]);
        });

        this.pages['OPS'] = container;
    }

    getBinaryOpsOrderLabel(order) {
        if (order === 'intel') return 'Intel (dst <- src)';
        return 'GNU (src -> dst)';
    }

    createOpsOrderDropdown(container, width, height) {
        const sf = this.scaleFactor;
        const dropdownWidth = 380 * sf;
        const dropdownHeight = 58 * sf;
        const rightMargin = 26 * sf;
        const topMargin = 72 * sf;
        const centerX = width - rightMargin - (dropdownWidth / 2);
        const centerY = topMargin;

        const panelBg = this.add.rectangle(centerX, centerY - (8 * sf), dropdownWidth + (20 * sf), 96 * sf, 0x070b14, 0.78);
        panelBg.setStrokeStyle(Math.max(1, Math.round(2 * sf)), 0x20304a, 1);

        const title = this.add.text(centerX, centerY - (44 * sf), 'OPERAND ORDER', {
            fontFamily: 'Arial',
            fontSize: `${18 * sf}px`,
            color: '#f8fbff'
        }).setOrigin(0.5);

        const closedFill = this.add.rectangle(centerX, centerY, dropdownWidth, dropdownHeight, 0x10182a, 0.98);
        closedFill.setStrokeStyle(Math.max(2, Math.round(2 * sf)), 0xd9e7ff, 1);
        closedFill.setInteractive({ useHandCursor: true });

        const closedBg = this.add.rectangle(centerX, centerY, dropdownWidth, dropdownHeight, 0x000000, 0);
        closedBg.setInteractive({ useHandCursor: true });

        const selectedText = this.add.text(centerX - (12 * sf), centerY, this.getBinaryOpsOrderLabel(this.binaryOpsOrder), {
            fontFamily: 'Arial',
            fontSize: `${21 * sf}px`,
            color: '#ffffff'
        }).setOrigin(0.5);
        selectedText.setInteractive({ useHandCursor: true });

        const arrowText = this.add.text(centerX + (dropdownWidth / 2) - (20 * sf), centerY, '▼', {
            fontFamily: 'Arial',
            fontSize: `${24 * sf}px`,
            color: '#ffffff'
        }).setOrigin(0.5);
        arrowText.setInteractive({ useHandCursor: true });

        const optionsContainer = this.add.container(0, 0);
        optionsContainer.setVisible(false);

        const options = [
            { key: 'gnu', label: this.getBinaryOpsOrderLabel('gnu') },
            { key: 'intel', label: this.getBinaryOpsOrderLabel('intel') }
        ];

        const optionHeight = 54 * sf;
        const optionGap = 6 * sf;
        const optionsTop = centerY + (dropdownHeight / 2) + (10 * sf);
        const optionRows = [];

        const refreshOptionStyles = () => {
            optionRows.forEach((row) => {
                const isSelected = row.key === this.binaryOpsOrder;
                row.fill.setFillStyle(isSelected ? 0x204d2d : 0x141f33, isSelected ? 1 : 0.95);
                row.fill.setStrokeStyle(Math.max(2, Math.round(2 * sf)), isSelected ? 0x9af0b2 : 0xd9e7ff, 1);
                row.text.setColor(isSelected ? '#ffffff' : '#f4f7ff');
            });
        };

        options.forEach((option, idx) => {
            const optionY = optionsTop + idx * (optionHeight + optionGap) + (optionHeight / 2);

            const optionFill = this.add.rectangle(centerX, optionY, dropdownWidth, optionHeight, 0x141f33, 0.95);
            optionFill.setStrokeStyle(Math.max(2, Math.round(2 * sf)), 0xd9e7ff, 1);
            optionFill.setInteractive({ useHandCursor: true });

            const optionHit = this.add.rectangle(centerX, optionY, dropdownWidth, optionHeight, 0x000000, 0);
            optionHit.setInteractive({ useHandCursor: true });

            const optionText = this.add.text(centerX, optionY, option.label, {
                fontFamily: 'Arial',
                fontSize: `${20 * sf}px`,
                color: '#ffffff'
            }).setOrigin(0.5);
            optionText.setInteractive({ useHandCursor: true });

            const selectOption = () => {
                this.binaryOpsOrder = option.key;
                selectedText.setText(option.label);
                refreshOptionStyles();
                optionsContainer.setVisible(false);
                arrowText.setText('▼');
            };

            optionFill.on('pointerdown', selectOption);
            optionHit.on('pointerdown', selectOption);
            optionText.on('pointerdown', selectOption);

            optionHit.on('pointerover', () => {
                if (option.key !== this.binaryOpsOrder) {
                    optionFill.setFillStyle(0x1b2a42, 0.98);
                }
            });

            optionHit.on('pointerout', () => {
                refreshOptionStyles();
            });

            optionRows.push({ key: option.key, fill: optionFill, text: optionText });
            optionsContainer.add([optionFill, optionHit, optionText]);
        });

        refreshOptionStyles();

        const toggleDropdown = () => {
            const shouldOpen = !optionsContainer.visible;
            optionsContainer.setVisible(shouldOpen);
            arrowText.setText(shouldOpen ? '▲' : '▼');
        };

        closedBg.on('pointerdown', toggleDropdown);
        closedFill.on('pointerdown', toggleDropdown);
        selectedText.on('pointerdown', toggleDropdown);
        arrowText.on('pointerdown', toggleDropdown);

        container.add([panelBg, title, closedFill, closedBg, selectedText, arrowText, optionsContainer]);
    }

    startGame() {
        // Envía la configuración personalizada en bruto; MoonGame se encarga del mapeo interno.
        this.scene.start('GameScene', {
            difficulty: 'CUSTOM',
            customConfig: {
                energy: this.energy,
                initialRegistersCount: this.initRegistersCount, // 1, 2, 3
                selectedEventKeys: Array.from(this.selectedEventCardIndices)
                    .sort((a, b) => a - b)
                    .map(index => this.allEvents[index]),
                selectedOpKeys: Array.from(this.selectedOps),
                binaryOpsOrder: this.binaryOpsOrder
            }
        });
    }
}
