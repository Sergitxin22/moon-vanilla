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
        // Simular carga de recursos. Aquí en Vanilla cargaremos imágenes si es necesario precargarlas.
        // Al usar DOM, el navegador ya hace la carga sobre la marcha con img,
        // pero podemos precargar texturas si queremos.
        let progress = 0;
        const fill = this.shadowRoot.getElementById('fill');

        const interval = setInterval(() => {
            progress += 10;
            if (fill) fill.style.width = `${progress}%`;

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.router.navigate('menu');
                }, 500);
            }
        }, 50);
    }
}

customElements.define('scene-boot', SceneBoot);
