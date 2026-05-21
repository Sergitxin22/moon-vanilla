export class SceneEnd extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.won = false;
    }

    init(data, router) {
        this.router = router;
        if (data) {
            this.won = data.won === true;
        }
    }

    connectedCallback() {
        this.render();
        this.shadowRoot.getElementById('menu-btn').addEventListener('pointerdown', () => {
            this.router.navigate('menu');
        });
    }

    render() {
        const imgSrc = this.won
            ? 'assets/texture/menu_end/mission_accomplished.png'
            : 'assets/texture/menu_end/mission_failure.png';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --sz: min(9vw, 14vh);
                    display: block;
                    width: 100%;
                    height: 100%;
                    background: url('assets/texture/game/mat-empty.png') center/cover no-repeat;
                    position: relative;
                    overflow: hidden;
                }
                .center {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    align-items: center;
                    justify-content: center;
                }
                .result-img {
                    max-width: 60vw;
                    max-height: 60vh;
                    object-fit: contain;
                }
                .menu-btn {
                    position: absolute;
                    bottom: calc(var(--sz) * 0.4);
                    right: calc(var(--sz) * 0.4);
                    width: var(--sz);
                    height: var(--sz);
                    cursor: pointer;
                    object-fit: contain;
                    display: block;
                    transition: transform 0.1s, opacity 0.1s;
                }
                .menu-btn:hover  { transform: scale(1.1); opacity: 0.85; }
                .menu-btn:active { transform: scale(0.92); }
            </style>
            <div class="center">
                <img class="result-img" src="${imgSrc}" draggable="false" alt="">
            </div>
            <img class="menu-btn" id="menu-btn" src="assets/texture/menu_return.png" draggable="false" alt="Menu">
        `;
    }
}

customElements.define('scene-end', SceneEnd);
