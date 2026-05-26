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
        // Precargar la imagen de fondo y navegar solo cuando esté lista
        const bgUrl = 'assets/texture/menu_main/menu_main_background.png';
        const img = new window.Image();
        img.src = bgUrl;
        img.onload = () => {
            // Cuando la imagen esté cargada, navegar al menú
            this.router.navigate('menu');
        };
        img.onerror = () => {
            // Si falla la carga, navegar igual tras breve retardo
            setTimeout(() => {
                this.router.navigate('menu');
            }, 500);
        };
    }
}

customElements.define('scene-boot', SceneBoot);
