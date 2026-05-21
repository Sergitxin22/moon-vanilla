export class AppRouter {
    constructor(container) {
        this.container = container;
        this.currentScene = null;
    }

    navigate(routeName, data = {}) {
        // Limpiamos la escena actual
        this.container.innerHTML = '';

        // Determinar qué componente cargar
        let tagName = '';
        switch (routeName) {
            case 'boot':
                tagName = 'scene-boot';
                break;
            case 'menu':
                tagName = 'scene-menu';
                break;
            case 'custom':
                tagName = 'scene-custom';
                break;
            case 'game':
                tagName = 'scene-game';
                break;
            case 'end':
                tagName = 'scene-end';
                break;
            default:
                console.error(`Route ${routeName} not found`);
                return;
        }

        // Crear elemento y añadir base data si hace falta
        this.currentScene = document.createElement(tagName);
        if (this.currentScene.init) {
            this.currentScene.init(data, this);
        }

        this.container.appendChild(this.currentScene);
    }
}
