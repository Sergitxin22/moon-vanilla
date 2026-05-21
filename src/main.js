import { AppRouter } from './core/Router.js';
import './components/scenes/SceneBoot.js';
import './components/scenes/SceneMenu.js';
import './components/scenes/SceneCustom.js';
import './components/scenes/SceneGame.js';
import './components/scenes/SceneEnd.js';

// Punto de entrada de la aplicación Vanilla JS
document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('game-container');

    // Inicializar el enrutador principal
    const router = new AppRouter(appContainer);

    // Comenzar en la escena de Boot (Carga de recursos)
    router.navigate('boot');
});
