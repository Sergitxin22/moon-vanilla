// Centraliza los eventos para comunicar Modelos y Componentes sin acoplarlos
export class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event, listenerToCheck) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(
            (listener) => listener !== listenerToCheck
        );
    }

    emit(event, payload) {
        if (!this.events[event]) return;
        this.events[event].forEach((listener) => {
            listener(payload);
        });
    }
}

// Instancia única (Singleton) para eventos del juego
export const gameEvents = new EventEmitter();
