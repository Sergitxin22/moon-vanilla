export class SceneMenu extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.router = null;
    }

    init(data, router) {
        this.router = router;
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    background: url('assets/texture/menu_main/menu_main_background.png') center/100% 100% no-repeat;
                    position: relative;
                }
                .menu-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    padding-top: min(6.25vw, 11.11vh);

                    padding-top: min(6.25dvw, 11.11dvh);
                }
                .row {
                    display: flex;
                    justify-content: center;
                    gap: min(6.25vw, 11.11vh);
                    margin-bottom: min(1.5625vw, 2.78vh);

                    gap: min(6.25dvw, 11.11dvh);
                    margin-bottom: min(1.5625dvw, 2.78dvh);
                }
                .btn {
                    width: min(15.625vw, 27.78vh);
                    height: min(15.625vw, 27.78vh);

                    width: min(15.625dvw, 27.78dvh);
                    height: min(15.625dvw, 27.78dvh);
                    cursor: pointer;
                    transition: transform 0.1s;
                    touch-action: manipulation;
                }
                .btn:active {
                    transform: scale(0.95);
                }
                .btn:hover {
                    transform: scale(1.05);
                }
            </style>
            <div class="menu-container">
                <div class="row">
                    <img src="assets/texture/menu_main/play_easy.png" class="btn" data-diff="EASY" alt="Easy" draggable="false">
                    <img src="assets/texture/menu_main/play_medium.png" class="btn" data-diff="MEDIUM" alt="Medium" draggable="false">
                    <img src="assets/texture/menu_main/play_hard.png" class="btn" data-diff="HARD" alt="Hard" draggable="false">
                </div>
                <div class="row">
                    <img src="assets/texture/menu_main/play_custom.png" class="btn" data-diff="CUSTOM" alt="Custom" draggable="false">
                    <img src="assets/texture/menu_main/about.png" class="btn" data-action="about" alt="About" draggable="false">
                </div>
            </div>
        `;
    }

    setupEvents() {
        const buttons = this.shadowRoot.querySelectorAll('.btn');
        buttons.forEach(btn => {
            // Utilizamos 'pointerdown' para soporte táctil inmediato sin ms de delay
            btn.addEventListener('pointerdown', (e) => {
                const difficulty = e.target.getAttribute('data-diff');

                if (difficulty === 'CUSTOM') {
                    this.router.navigate('custom');
                } else {
                    this.router.navigate('game', { difficulty: difficulty });
                }
            });
        });
    }
}

customElements.define('scene-menu', SceneMenu);
