export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    // Crea un botón de menú con interacciones de hover y click.
    createMenuButton({ x, y, key, size, onClick }) {
        const image = this.add.image(x, y, key);
        image.setDisplaySize(size, size);

        const originalScaleX = image.scaleX;
        const originalScaleY = image.scaleY;

        image.setInteractive({ useHandCursor: true });
        image.on('pointerdown', onClick);
        image.on('pointerover', () => image.setScale(originalScaleX * 1.05, originalScaleY * 1.05));
        image.on('pointerout', () => image.setScale(originalScaleX, originalScaleY));

        return image;
    }

    // Navega según la opción elegida en el menú principal.
    handleMenuAction(buttonData) {
        if (buttonData.difficulty) {
            console.log(`Dificultad seleccionada: ${buttonData.difficulty}`);
            if (buttonData.difficulty === 'CUSTOM') {
                this.scene.start('CustomScene');
                return;
            }

            this.scene.start('GameScene', { difficulty: buttonData.difficulty });
            return;
        }

        if (buttonData.action === 'about') {
            console.log('Botón ABOUT pulsado');
        }
    }

    create() {
        const { width, height } = this.scale;

        // Calcular factor de escala
        const scaleX = width / 1280;
        const scaleY = height / 720;
        const scaleFactor = Math.min(scaleX, scaleY);

        // Fondo
        const bg = this.add.image(width / 2, height / 2, 'menu-bg');
        // Usar escala coverage (cubrir) para asegurar que se llena la pantalla sin deformar en exceso
        // o dejar huecos si la relación de aspecto no coincide.
        const bgScale = Math.max(width / bg.width, height / bg.height);
        bg.setScale(bgScale);

        const marginTop = 80 * scaleFactor;
        // Tamaño de los botones
        const btnSize = 200 * scaleFactor;
        const gapX = 80 * scaleFactor;
        const gapY = 20 * scaleFactor;

        // Posiciones de los botones superiores (EASY, MEDIUM, HARD)
        const topRowY = height / 2 - gapY - btnSize / 2 + marginTop;
        const topButtons = [
            { key: 'play-easy', x: width / 2 - btnSize - gapX, difficulty: 'EASY' },
            { key: 'play-medium', x: width / 2, difficulty: 'MEDIUM' },
            { key: 'play-hard', x: width / 2 + btnSize + gapX, difficulty: 'HARD' }
        ];

        topButtons.forEach(btn => {
            this.createMenuButton({
                x: btn.x,
                y: topRowY,
                key: btn.key,
                size: btnSize,
                onClick: () => this.handleMenuAction(btn)
            });
        });

        // Posiciones de los botones inferiores (CUSTOM, ABOUT)
        const bottomRowY = height / 2 + gapY + btnSize / 2 + marginTop;
        const bottomButtons = [
            { key: 'play-custom', x: width / 2, difficulty: 'CUSTOM' },
            { key: 'about', x: width / 2 + btnSize + gapX, action: 'about' }
        ];

        bottomButtons.forEach(btn => {
            this.createMenuButton({
                x: btn.x,
                y: bottomRowY,
                key: btn.key,
                size: btnSize,
                onClick: () => this.handleMenuAction(btn)
            });
        });
    }
}
