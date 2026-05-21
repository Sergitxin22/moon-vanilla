export const GameState = {
    INIT_SHOW: 'INIT_SHOW',
    INIT_LOADING_LOAD_VALUES: 'INIT_LOADING_LOAD_VALUES',
    NEW_OBJECTIVE: 'NEW_OBJECTIVE',
    SELECT_OPERATION: 'SELECT_OPERATION',
    SELECT_REGISTER_INITIAL: 'SELECT_REGISTER_INITIAL',
    SELECT_REGISTER_LAST: 'SELECT_REGISTER_LAST',
    APPLY_OPERATION: 'APPLY_OPERATION',
    CHECK_OBJECTIVE: 'CHECK_OBJECTIVE',
    COMPLETED_OBJECTIVE: 'COMPLETED_OBJECTIVE',
    ANIMATION_LOOP: 'ANIMATION_LOOP',
    GAME_OVER: 'GAME_OVER'
};

export const ENERGY_MAP = {
    EASY: 3,
    MEDIUM: 2.5,
    HARD: 2,
    CUSTOM: 3,
};

export const INITIAL_REGISTERS_MAP = {
    EASY: 3,
    MEDIUM: 2,
    HARD: 1,
    CUSTOM: 3,
};

export const UNARY_OPS = ['INC', 'DEC', 'ROL', 'ROR', 'NOT'];
export const BINARY_OPS = ['MOV', 'AND', 'OR', 'XOR', 'ADD', 'SUB', 'NAND', 'NOR', 'XNOR'];

export const OP_COSTS = {
    INC: 2.0, DEC: 2.0,
    ROL: 1.0, ROR: 1.0, MOV: 1.0, NOT: 1.0,
    OR: 0.5, AND: 0.5, XOR: 0.5,
    ADD: 1.5, SUB: 1.5,
    NAND: 1.0, NOR: 1.0, XNOR: 1.0,
};

export const OP_GROUPS_BY_COLOR = {
    green: ['INC', 'DEC', 'ADD', 'SUB'],
    yellow: ['ROL', 'ROR'],
    pink: ['MOV'],
    red: ['OR', 'AND', 'XOR'],
    white: ['NOT', 'NOR', 'NAND', 'XNOR'],
};

// Eventos de juego
export const EVENT_TYPES = {
    BUG: 'BUG',
    ERROR_OP_ROL: 'ERROR_OP_ROL',
    ERROR_OP_XOR: 'ERROR_OP_XOR',
    ERROR_OP_NOT: 'ERROR_OP_NOT',
    ERROR_REG_B: 'ERROR_REG_B',
    ERROR_REG_C: 'ERROR_REG_C',
    ERROR_REG_D: 'ERROR_REG_D',
    RESET_REG_A: 'RESET_REG_A',
    RESET_REG_B: 'RESET_REG_B',
    RESET_REG_C: 'RESET_REG_C',
    RESET_REG_D: 'RESET_REG_D',
    RESET_BIT_1: 'RESET_BIT_1',
    RESET_BIT_2: 'RESET_BIT_2',
    RESET_BIT_3: 'RESET_BIT_3',
    OK: 'OK',
};

// Configuración de eventos por dificultad
export const EVENT_CONFIG = {
    EASY: { events: [] },
    MEDIUM: {
        events: [
            EVENT_TYPES.RESET_REG_A, EVENT_TYPES.RESET_REG_B,
            EVENT_TYPES.RESET_REG_C, EVENT_TYPES.RESET_REG_D,
            EVENT_TYPES.BUG,
        ],
    },
    HARD: {
        events: [
            EVENT_TYPES.RESET_REG_A, EVENT_TYPES.RESET_REG_B,
            EVENT_TYPES.RESET_REG_C, EVENT_TYPES.RESET_REG_D,
            EVENT_TYPES.ERROR_REG_B, EVENT_TYPES.ERROR_REG_C,
            EVENT_TYPES.ERROR_REG_D, EVENT_TYPES.ERROR_OP_NOT,
            EVENT_TYPES.ERROR_OP_XOR, EVENT_TYPES.BUG,
            EVENT_TYPES.BUG, EVENT_TYPES.BUG,
            EVENT_TYPES.OK, EVENT_TYPES.OK, EVENT_TYPES.OK,
        ],
    },
    CUSTOM: { events: [] },
};

export const REGISTER_INDEX_TO_NAME = ['D', 'C', 'B', 'A'];
export const REGISTER_NAME_TO_INDEX = { D: 0, C: 1, B: 2, A: 3 };
