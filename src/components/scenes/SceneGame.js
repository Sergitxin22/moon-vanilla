import '../game/MoonBoard.js';
import { AppController } from '../../core/AppController.js';

export class SceneGame extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.difficulty = 'EASY';
        this.customConfig = null;
        this.controller = null;
    }

    init(data, router) {
        this.router = router;
        if (data) {
            this.difficulty = data.difficulty || 'EASY';
            this.customConfig = data.customConfig || null;
        }
    }

    connectedCallback() {
        this.render();
        this.setupEvents();

        // Inicializar el controlador del juego
        const board = this.shadowRoot.getElementById('main-board');
        this.controller = new AppController(this, board, this.difficulty, this.customConfig);
    }

    disconnectedCallback() {
        if (this.controller) {
            this.controller.destroy();
            this.controller = null;
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100vw;
                    height: 100vh;
                    background: #000;
                    position: relative;
                    overflow: hidden; /* Evitar que el tapete genere scroll */
                }
                .board-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                }
            </style>
                        
            <div class="board-container">
                <moon-board id="main-board"></moon-board>
            </div>
        `;
    }

    setupEvents() {
        this.shadowRoot.addEventListener('return-menu', () => {
            // Ir al menú gestionado por la flecha nativa del gameboard
            this.router.navigate('menu');
        });
    }
}

customElements.define('scene-game', SceneGame);
