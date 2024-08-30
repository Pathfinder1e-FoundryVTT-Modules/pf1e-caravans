import {MODULE_ID} from "../_moduleId.mjs";

export const sheetSections = {
    caravanFeat: {
        default: {
            category: "caravanFeat",
            create: {type: `${MODULE_ID}.feat`},
            filters: {type: `${MODULE_ID}.feat`},
            id: "default",
            interface: {
                create: true,
            },
            label: "PF1.Feats",
            path: "caravanFeat.default"
        }
    },
    caravanCargo: {
        equipment: {
            category: "caravanCargo",
            create: {type: `${MODULE_ID}.equipment`},
            filters: {type: `${MODULE_ID}.equipment`},
            id: "equipment",
            interface: {
                unitWeight: true,
                create: true,
            },
            label: "PF1ECaravans.Equipment",
            path: "caravanCargo.equipment",
        },
        treasure: {
            category: "caravanCargo",
            filters: {type: "treasure"},
            id: "treasure",
            interface: {
                unitWeight: false,
                create: false,
            },
            label: "PF1ECaravans.Treasure",
            path: "caravanCargo.treasure",
        }
    }
}