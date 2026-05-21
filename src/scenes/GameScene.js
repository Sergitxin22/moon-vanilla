import MoonGame from '../objects/MoonGame.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    // Recibe los datos de navegación enviados por otras escenas.
    init(data) {
        this.difficulty = data.difficulty || 'EASY';
        this.customConfig = data.customConfig || null;
    }

    // Crea la partida y delega la lógica principal en MoonGame.
    create() {
        // Fondo base de la escena de juego
        this.cameras.main.setBackgroundColor('#1a1a1a');

        this.add.text(20, 20, `Difficulty: ${this.difficulty}`, { font: '20px Arial', fill: '#ffffff' });

        // Inicializa la lógica completa del tablero
        this.moonGame = new MoonGame(this, this.difficulty, this.customConfig);
    }
}
