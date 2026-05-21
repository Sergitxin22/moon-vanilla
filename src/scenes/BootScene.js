export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const loadImages = (images) => {
            images.forEach(([key, path]) => this.load.image(key, path));
        };

        // Fondos y tapete base
        loadImages([
            ['menu-bg', 'assets/texture/menu_main/menu_main_background.png'],
            ['cust-bg', 'assets/texture/menu_setup/menu_setup_background.png'],
            ['mat-empty', 'assets/texture/game/mat-empty.png']
        ]);

        // Botones de dificultad y utilidades
        loadImages([
            ['play-easy', 'assets/texture/menu_main/play_easy.png'],
            ['play-medium', 'assets/texture/menu_main/play_medium.png'],
            ['play-hard', 'assets/texture/menu_main/play_hard.png'],
            ['play-custom', 'assets/texture/menu_main/play_custom.png'],
            ['about', 'assets/texture/menu_main/about.png'],
            ['sound', 'assets/texture/menu_main/sound.png'],
            ['back', 'assets/texture/game/back.png'],
            ['menu-return', 'assets/texture/menu_return.png']
        ]);

        // Elementos del tablero
        loadImages([
            ['bat', 'assets/texture/game/bat.png'],
            ['bat-half', 'assets/texture/game/bat-half.png'],
            ['bat-empty', 'assets/texture/game/bat-empty.png'],
            ['bit0', 'assets/texture/game/bit0.png'],
            ['bit1', 'assets/texture/game/bit1.png'],
            ['op', 'assets/texture/game/mat-op-slot.png']
        ]);

        // Operaciones
        loadImages([
            ['inc', 'assets/texture/game/op-1-inc.png'],
            ['dec', 'assets/texture/game/op-1-dec.png'],
            ['rol', 'assets/texture/game/op-1-rol.png'],
            ['ror', 'assets/texture/game/op-1-ror.png'],
            ['not', 'assets/texture/game/op-1-not.png'],
            ['mov', 'assets/texture/game/op-2-mov.png'],
            ['or', 'assets/texture/game/op-2-or.png'],
            ['and', 'assets/texture/game/op-2-and.png'],
            ['xor', 'assets/texture/game/op-2-xor.png'],
            ['add', 'assets/texture/game/op-2-add.png'],
            ['sub', 'assets/texture/game/op-2-sub.png'],
            ['nand', 'assets/texture/game/op-2-nand.png'],
            ['nor', 'assets/texture/game/op-2-nor.png'],
            ['xnor', 'assets/texture/game/op-2-xnor.png']
        ]);

        // Marcos y selección por color
        loadImages([
            ['color-green-selected', 'assets/texture/game/color-green-selected.png'],
            ['color-yellow-selected', 'assets/texture/game/color-yellow-selected.png'],
            ['color-pink-selected', 'assets/texture/game/color-pink-selected.png'],
            ['color-red-selected', 'assets/texture/game/color-red-selected.png'],
            ['color-white-selected', 'assets/texture/game/color-white-selected.png'],
            ['color-green-border', 'assets/texture/game/color-green-border.png'],
            ['color-yellow-border', 'assets/texture/game/color-yellow-border.png'],
            ['color-pink-border', 'assets/texture/game/color-pink-border.png'],
            ['color-red-border', 'assets/texture/game/color-red-border.png'],
            ['color-white-border', 'assets/texture/game/color-white-border.png']
        ]);

        // Pantalla de configuración personalizada
        loadImages([
            ['cust-tab-misc', 'assets/texture/menu_setup/tab_misc.png'],
            ['cust-tab-misc-sel', 'assets/texture/menu_setup/tab_misc_selected.png'],
            ['cust-tab-events', 'assets/texture/menu_setup/tab_events.png'],
            ['cust-tab-events-sel', 'assets/texture/menu_setup/tab_events_selected.png'],
            ['cust-tab-ops', 'assets/texture/menu_setup/tab_ops.png'],
            ['cust-tab-ops-sel', 'assets/texture/menu_setup/tab_ops_selected.png'],
            ['cust-btn-plus', 'assets/texture/menu_setup/plus_sign.png'],
            ['cust-btn-minus', 'assets/texture/menu_setup/minus_sign.png'],
            ['cust-play', 'assets/texture/menu_setup/play.png'],
            ['cust-misc-init', 'assets/texture/menu_setup/misc_init.png'],
            ['cust-square', 'assets/texture/menu_setup/emty_square.png']
        ]);

        // Eventos especiales
        loadImages([
            ['evento-bug', 'assets/texture/game/evento-bug.png'],
            ['evento-error_rol', 'assets/texture/game/evento-error_rol.png'],
            ['evento-error_xor', 'assets/texture/game/evento-error_xor.png'],
            ['evento-error_not', 'assets/texture/game/evento-error_not.png'],
            ['evento-error_bx', 'assets/texture/game/evento-error_bx.png'],
            ['evento-error_cx', 'assets/texture/game/evento-error_cx.png'],
            ['evento-error_dx', 'assets/texture/game/evento-error_dx.png'],
            ['evento-reset_ax', 'assets/texture/game/evento-reset_ax.png'],
            ['evento-reset_bx', 'assets/texture/game/evento-reset_bx.png'],
            ['evento-reset_cx', 'assets/texture/game/evento-reset_cx.png'],
            ['evento-reset_dx', 'assets/texture/game/evento-reset_dx.png'],
            ['evento-reset_value1', 'assets/texture/game/evento-reset_value1.png'],
            ['evento-reset_value2', 'assets/texture/game/evento-reset_value2.png'],
            ['evento-reset_value3', 'assets/texture/game/evento-reset_value3.png'],
            ['evento-ok', 'assets/texture/game/evento-ok.png']
        ]);

        // Ranuras de mazo (0-5)
        for (let i = 0; i <= 5; i++) {
            this.load.image(`slot-${i}`, `assets/texture/game/mat-obj-slot-${i}.png`);
        }

        // Fin de partida
        this.load.image('mission-accomplished', 'assets/texture/menu_end/mission_accomplished.png');
        this.load.image('mission-failure', 'assets/texture/menu_end/mission_failure.png');

        // Registros (0-3)
        for (let i = 0; i <= 3; i++) {
            this.load.image(`mat-register-${i}`, `assets/texture/game/mat-register-${i}.png`);
        }

        // Valores de bit de cabecera (0-3)
        for (let i = 0; i <= 3; i++) {
            this.load.image(`mat-bit-value-${i}`, `assets/texture/game/mat-bit-value-${i}.png`);
        }

        // Objetivos (0-15)
        for (let i = 0; i <= 15; i++) {
            // Convierte a binario de 4 bits (ej.: 1 -> "0001")
            const binaryStr = i.toString(2).padStart(4, '0');
            this.load.image(`objective-${i}`, `assets/texture/game/objetivo-${binaryStr}.png`);
        }
    }

    create() {
        console.log('Recursos cargados correctamente');
        this.scene.start('MenuScene');
    }
}
