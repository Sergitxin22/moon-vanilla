export class SceneBoot extends HTMLElement {
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
        this.loadAssets();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: url('assets/texture/menu_main/menu_main_background.png') center center;
                    background-size: cover;
                    color: white;
                }
                .loader {
                    font-size: 1.5rem;
                    text-transform: uppercase;
                    margin-top: 20px;
                    font-family: monospace;
                }
            </style>
            <div>
                <!-- Omitimos de momento la barra temporal y dejamos que cargue limpio hacia el menú -->
            </div>
            <div class="loader">Loading Moon...</div>
        `;
    }

    loadAssets() {
        // Precargar todas las imágenes necesarias antes de navegar
        const urls = [
            'assets/texture/menu_main/menu_main_background.png',
            'assets/texture/menu_main/play_easy.png',
            'assets/texture/menu_main/play_medium.png',
            'assets/texture/menu_main/play_hard.png',
            'assets/texture/menu_main/play_custom.png',
            'assets/texture/menu_main/about.png'
        ];

        const loadImage = (url) => {
            return new Promise((resolve) => {
                const img = new Image();

                img.onload = () => resolve(url);
                img.onerror = () => {
                    console.warn(`Error cargando: ${url}`);
                    resolve(url); // sigue aunque falle
                };

                img.src = url;
            });
        };

        Promise.all(urls.map(loadImage))
            .then(() => {
                this.router.navigate('menu');
            });
    }
}

customElements.define('scene-boot', SceneBoot);
