export class OperationEngine {
    // Aplica una máscara de 4 bits para mantener los valores entre 0 y 15
    static mask4(val) {
        return val & 0xF;
    }

    static INC(val) {
        return this.mask4(val + 1);
    }

    static DEC(val) {
        return this.mask4(val - 1 + 16);
    }

    static ROL(val) {
        // Rota a la izquierda en 4 bits
        return this.mask4((val << 1) | (val >> 3));
    }

    static ROR(val) {
        // Rota a la derecha en 4 bits
        return this.mask4((val >> 1) | ((val & 1) << 3));
    }

    static NOT(val) {
        return this.mask4(~val);
    }

    static MOV(dest, src) {
        return this.mask4(src);
    }

    static AND(v1, v2) {
        return this.mask4(v1 & v2);
    }

    static OR(v1, v2) {
        return this.mask4(v1 | v2);
    }

    static XOR(v1, v2) {
        return this.mask4(v1 ^ v2);
    }

    static ADD(v1, v2) {
        return this.mask4(v1 + v2);
    }

    static SUB(v1, v2) {
        return this.mask4(v1 - v2 + 16);
    }

    static NAND(v1, v2) {
        return this.mask4(~(v1 & v2));
    }

    static NOR(v1, v2) {
        return this.mask4(~(v1 | v2));
    }

    static XNOR(v1, v2) {
        return this.mask4(~(v1 ^ v2));
    }

    // Ejecuta dinámicamente la operación según el nombre
    static execute(opName, val1, val2 = 0) {
        if (typeof this[opName] === 'function') {
            return this[opName](val1, val2);
        }
        console.error(`Operación desconocida: ${opName}`);
        return val1;
    }
}
