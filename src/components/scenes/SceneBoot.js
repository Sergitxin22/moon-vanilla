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
                    background: url('assets/texture/menu_main/menu_main_background.png') center/100% 100% no-repeat;
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
        const urls = [
            // menu_main
            'assets/texture/menu_main/menu_main_background.png',
            'assets/texture/menu_main/play_easy.png',
            'assets/texture/menu_main/play_medium.png',
            'assets/texture/menu_main/play_hard.png',
            'assets/texture/menu_main/play_custom.png',
            'assets/texture/menu_main/about.png',
            'assets/texture/menu_main/sound.png',
            // menu_end
            'assets/texture/menu_end/mission_accomplished.png',
            'assets/texture/menu_end/mission_failure.png',
            // menu_setup
            'assets/texture/menu_setup/dest.png',
            'assets/texture/menu_setup/emty_square.png',
            'assets/texture/menu_setup/left.png',
            'assets/texture/menu_setup/minus_sign.png',
            'assets/texture/menu_setup/misc_init.png',
            'assets/texture/menu_setup/play.png',
            'assets/texture/menu_setup/plus_sign.png',
            'assets/texture/menu_setup/right.png',
            'assets/texture/menu_setup/src_selected.png',
            'assets/texture/menu_setup/tab_events.png',
            'assets/texture/menu_setup/tab_events_selected.png',
            'assets/texture/menu_setup/tab_misc.png',
            'assets/texture/menu_setup/tab_misc_selected.png',
            'assets/texture/menu_setup/tab_ops.png',
            'assets/texture/menu_setup/tab_ops_selected.png',
            // menu_return
            'assets/texture/menu_return.png',
            // game - bits y colores
            'assets/texture/game/bit0.png',
            'assets/texture/game/bit1.png',
            'assets/texture/game/color-green-border.png',
            'assets/texture/game/color-green-selected.png',
            'assets/texture/game/color-pink-border.png',
            'assets/texture/game/color-pink-selected.png',
            'assets/texture/game/color-red-border.png',
            'assets/texture/game/color-red-selected.png',
            'assets/texture/game/color-white-border.png',
            'assets/texture/game/color-white-selected.png',
            'assets/texture/game/color-yellow-border.png',
            'assets/texture/game/color-yellow-selected.png',
            // game - eventos
            'assets/texture/game/evento-bug.png',
            'assets/texture/game/evento-error_bx.png',
            'assets/texture/game/evento-error_cx.png',
            'assets/texture/game/evento-error_dx.png',
            'assets/texture/game/evento-error_not.png',
            'assets/texture/game/evento-error_rol.png',
            'assets/texture/game/evento-error_xor.png',
            'assets/texture/game/evento-ok.png',
            'assets/texture/game/evento-reset_ax.png',
            'assets/texture/game/evento-reset_bx.png',
            'assets/texture/game/evento-reset_cx.png',
            'assets/texture/game/evento-reset_dx.png',
            'assets/texture/game/evento-reset_value1.png',
            'assets/texture/game/evento-reset_value2.png',
            'assets/texture/game/evento-reset_value3.png',
            // game - mat
            'assets/texture/game/mat-bit-value-0.png',
            'assets/texture/game/mat-bit-value-1.png',
            'assets/texture/game/mat-bit-value-2.png',
            'assets/texture/game/mat-bit-value-3.png',
            'assets/texture/game/mat-empty.png',
            'assets/texture/game/mat-obj-slot-0.png',
            'assets/texture/game/mat-obj-slot-1.png',
            'assets/texture/game/mat-obj-slot-2.png',
            'assets/texture/game/mat-obj-slot-3.png',
            'assets/texture/game/mat-obj-slot-4.png',
            'assets/texture/game/mat-obj-slot-5.png',
            'assets/texture/game/mat-op-slot.png',
            'assets/texture/game/mat-register-0.png',
            'assets/texture/game/mat-register-1.png',
            'assets/texture/game/mat-register-2.png',
            'assets/texture/game/mat-register-3.png',
            // game - objetivos (0000–1111)
            'assets/texture/game/objetivo-0000.png',
            'assets/texture/game/objetivo-0001.png',
            'assets/texture/game/objetivo-0010.png',
            'assets/texture/game/objetivo-0011.png',
            'assets/texture/game/objetivo-0100.png',
            'assets/texture/game/objetivo-0101.png',
            'assets/texture/game/objetivo-0110.png',
            'assets/texture/game/objetivo-0111.png',
            'assets/texture/game/objetivo-1000.png',
            'assets/texture/game/objetivo-1001.png',
            'assets/texture/game/objetivo-1010.png',
            'assets/texture/game/objetivo-1011.png',
            'assets/texture/game/objetivo-1100.png',
            'assets/texture/game/objetivo-1101.png',
            'assets/texture/game/objetivo-1110.png',
            'assets/texture/game/objetivo-1111.png',
            // game - operaciones
            'assets/texture/game/op-1-dec.png',
            'assets/texture/game/op-1-inc.png',
            'assets/texture/game/op-1-not.png',
            'assets/texture/game/op-1-rol.png',
            'assets/texture/game/op-1-ror.png',
            'assets/texture/game/op-2-add.png',
            'assets/texture/game/op-2-and.png',
            'assets/texture/game/op-2-mov.png',
            'assets/texture/game/op-2-nand.png',
            'assets/texture/game/op-2-nor.png',
            'assets/texture/game/op-2-or.png',
            'assets/texture/game/op-2-sub.png',
            'assets/texture/game/op-2-xnor.png',
            'assets/texture/game/op-2-xor.png',
            // game - misc
            'assets/texture/game/back.png',
            'assets/texture/game/bat-empty.png',
            'assets/texture/game/bat-half.png',
            'assets/texture/game/bat.png',
            'assets/texture/game/moon-title.png',
            'assets/texture/game/setup-title.png'
        ];

        const loadImage = (url) => {
            const img = new Image();
            img.src = url;
            return img.decode().catch(() => { });
        };

        Promise.all(urls.map(loadImage)).then(() => this.router.navigate('menu'));
    }
}

customElements.define('scene-boot', SceneBoot);
