import {MODULE_ID} from "../_moduleId.mjs";

export const sheetSections = {
    caravanFeat: {
        feat: {
            category: "caravanFeat",
            create: {type: `${MODULE_ID}.feat`, system: {subType: "feat"}},
            filters: {type: `${MODULE_ID}.feat`, system: {subType: "feat"}},
            id: "default",
            interface: {
                create: true,
            },
            label: "PF1.Subtypes.Item.pf1e-caravans.feat.feat.Plural",
            path: "caravanFeat.default"
        },
        feature: {
            category: "caravanFeat",
            create: {type: `${MODULE_ID}.feat`, system: {subType: "feature"}},
            filters: {type: `${MODULE_ID}.feat`, system: {subType: "feature"}},
            id: "feature",
            interface: {
                create: true,
            },
            label: "PF1.Subtypes.Item.pf1e-caravans.feat.feature.Plural",
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
                convert: true
            },
            label: "PF1ECaravans.Treasure",
            path: "caravanCargo.treasure",
        }
    }
}