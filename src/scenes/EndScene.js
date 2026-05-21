export default class EndScene extends Phaser.Scene {
    constructor() {
        super('EndScene');
    }

    // Recibe el estado de victoria/derrota al finalizar la partida.
    init(data) {
        // Bandera que indica si el jugador ganó o perdió
        this.isWon = !!(data && data.won);
    }

    // Renderiza la pantalla final y habilita el regreso al menú principal.
    create() {
        const { width, height } = this.scale;
        const scaleFactor = Math.min(width / 1280, height / 720);

        // Fondo reutilizando el tapete principal
        const bg = this.add.image(width / 2, height / 2, 'mat-empty');
        bg.setDisplaySize(width, height);

        // Imagen central según estado de victoria, escalada similar a los botones
        const resultKey = this.isWon ? 'mission-accomplished' : 'mission-failure';
        const resultImg = this.add.image(width / 2, height * 0.45, resultKey);
        resultImg.setOrigin(0.5);

        // Calcula tamaño objetivo respetando proporción y usando el mismo factor base
        const source = this.textures.get(resultKey).getSourceImage();
        const ratio = source.height / source.width;
        const targetWidth = Math.min(width * 0.8, 760 * scaleFactor);
        const computedHeight = targetWidth * ratio;
        const targetHeight = Math.min(computedHeight, height * 0.6);
        const finalWidth = Math.min(targetWidth, targetHeight / ratio);
        const finalHeight = finalWidth * ratio;
        resultImg.setDisplaySize(finalWidth, finalHeight);

        // Botón para volver al menú principal
        const menuButtonSize = 120 * scaleFactor;
        const menuButton = this.add.image(width - menuButtonSize, height * 0.75, 'menu-return');
        menuButton.setOrigin(0.5);
        menuButton.setDisplaySize(menuButtonSize, menuButtonSize);
        menuButton.setInteractive({ useHandCursor: true });
        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}
