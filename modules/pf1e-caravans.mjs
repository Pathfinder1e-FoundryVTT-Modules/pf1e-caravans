import * as Registry from "./registry/_module.mjs";
import * as Config from "./config/_module.mjs";
import {getChangeFlat} from "./hooks/getChangeFlat.mjs";
import {CaravanModel, EquipmentModel, FeatModel, TravelerModel, WagonModel} from "./dataModels/_module.mjs";
import {CaravanSheet, EquipmentSheet, FeatSheet, TravelerSheet, WagonSheet} from "./applications/_module.mjs";
import {CaravanActor, CaravanItem, TravelerItem, WagonItem} from "./documents/_module.mjs";

export const MODULE_ID = "pf1e-caravans";

Hooks.on("init", () => {
    registerConfig();
    registerActors();
    registerItems();
    registerTemplates();

    console.log(`${MODULE_ID} | Initialized`);
})

Hooks.once('libWrapper.Ready', () => {
    console.log(`${MODULE_ID} | Registering LibWrapper Hooks`);

    libWrapper.register(MODULE_ID, "pf1.applications.item.CreateDialog.prototype.getSubtypes", function (wrapper, type) {
        switch (type) {
            case `${MODULE_ID}.equipment`:
                return null;

            case `${MODULE_ID}.feat`:
                return null;

            case `${MODULE_ID}.traveler`:
                return pf1.registry.travelerRoles.reduce((all, value, key) => {
                    all[key] = value.name;
                    return all;
                }, {});

            case `${MODULE_ID}.wagon`:
                return pf1.registry.wagonTypes.reduce((all, value, key) => {
                    all[key] = value.name;
                    return all;
                }, {});

            default:
                return wrapper(type);
        }
    }, libWrapper.MIXED);
});

Hooks.on("pf1GetChangeFlat", getChangeFlat);

function registerConfig() {
    Object.assign(pf1.registry, Registry);
    mergeObject(pf1.config, Object.assign({}, Config));

    // SHEET SECTIONS
    let caravanWagonSections = {};
    let buffTargetSort = 0;
    pf1.registry.wagonTypes.map(wagonType => {
        caravanWagonSections[wagonType.id] = {
            category: "caravanWagon",
            create: {type: `${MODULE_ID}.wagon`, system: {subType: wagonType.id}},
            filters: {type: `${MODULE_ID}.wagon`, system: {subType: wagonType.id}},
            id: wagonType.id,
            interface: {
                create: true,
                max: wagonType.max,
            },
            label: game.i18n.localize(`PF1.Subtypes.Item.pf1e-caravans.wagon.${wagonType.id}.Plural`),
            path: `caravanWagon.${wagonType.id}`,
        };

        if (wagonType.max !== undefined) {
            pf1.config.buffTargets[`caravan_wagonLimit_${wagonType.id}`] = {
                label: `PF1ECaravans.BuffTargets.WagonLimit.${wagonType.id}`,
                category: "caravan",
                sort: 1410 + buffTargetSort++,
            }
        }
    })
    let caravanTravelerSections = {};
    buffTargetSort = 0;
    pf1.registry.travelerRoles.map(travelerRole => {
        caravanTravelerSections[travelerRole._id] = {
            category: "caravanTraveler",
            create: {type: `${MODULE_ID}.traveler`, system: {subType: travelerRole._id}},
            filters: {type: `${MODULE_ID}.traveler`, system: {subType: travelerRole._id}},
            id: travelerRole._id,
            interface: {
                create: true,
                hasTasks: (travelerRole.tasks || []).length > 0,
                max: travelerRole.max,
            },
            label: game.i18n.localize(`PF1.Subtypes.Item.pf1e-caravans.traveler.${travelerRole.id}.Plural`),
            path: `caravanTraveler.${travelerRole._id}`,
        }

        if (travelerRole.max !== undefined) {
            pf1.config.buffTargets[`caravan_travelerRoleLimit_${travelerRole.id}`] = {
                label: `PF1ECaravans.BuffTargets.TravelerRoleLimit.${travelerRole.id}`,
                category: "caravan",
                sort: 1310 + buffTargetSort++,
            }
        }
    })
    Object.assign(pf1.config.sheetSections, {
        caravanWagon: caravanWagonSections,
        caravanTraveler: caravanTravelerSections,
        caravanFeat: {
            default: {
                category: "caravanFeat",
                create: {type: `${MODULE_ID}.feat`},
                filters: {type: `${MODULE_ID}.feat`},
                id: "default",
                interface: {
                    create: true,
                },
                label: game.i18n.localize(`PF1.Feats`),
                path: `caravanFeat.default`,
            }
        }
    });
}

function registerActors() {
    Object.assign(CONFIG.Actor.documentClasses, {
        [`${MODULE_ID}.caravan`]: CaravanActor
    })
    Object.assign(pf1.documents.actor, {
        CaravanActor: CaravanActor
    })

    Object.assign(CONFIG.Actor.dataModels, {
        [`${MODULE_ID}.caravan`]: CaravanModel
    })

    const actorSheets = {
        [`${MODULE_ID}.caravan`]: CaravanSheet
    }

    for (let [type, sheet] of Object.entries(actorSheets)) {
        DocumentSheetConfig.registerSheet(Actor, MODULE_ID, sheet, {
            types: [type],
            makeDefault: true
        });
    }
}

function registerItems() {
    Object.assign(CONFIG.Item.documentClasses, {
        [`${MODULE_ID}.equipment`]: CaravanItem,
        [`${MODULE_ID}.feat`]: CaravanItem,
        [`${MODULE_ID}.traveler`]: TravelerItem,
        [`${MODULE_ID}.wagon`]: WagonItem,
    })
    Object.assign(pf1.documents.item, {
        CaravanItem: CaravanItem,
        TravelerItem: TravelerItem,
        WagonItem: WagonItem,
    })

    Object.assign(CONFIG.Item.dataModels, {
        [`${MODULE_ID}.equipment`]: EquipmentModel,
        [`${MODULE_ID}.feat`]: FeatModel,
        [`${MODULE_ID}.traveler`]: TravelerModel,
        [`${MODULE_ID}.wagon`]: WagonModel,
    })

    const itemSheets = {
        [`${MODULE_ID}.equipment`]: EquipmentSheet,
        [`${MODULE_ID}.feat`]: FeatSheet,
        [`${MODULE_ID}.traveler`]: TravelerSheet,
        [`${MODULE_ID}.wagon`]: WagonSheet,
    }

    for (let [type, sheet] of Object.entries(itemSheets)) {
        DocumentSheetConfig.registerSheet(Item, MODULE_ID, sheet, {
            types: [type],
            makeDefault: true
        });
    }
}

function registerTemplates() {
    loadTemplates([
        // ACTOR
        "modules/pf1e-caravans/templates/actor/caravan/parts/cargo.hbs",
        "modules/pf1e-caravans/templates/actor/caravan/parts/summary.hbs",
        "modules/pf1e-caravans/templates/actor/caravan/parts/travelers.hbs",
        "modules/pf1e-caravans/templates/actor/caravan/parts/wagons.hbs",
        "modules/pf1e-caravans/templates/actor/caravan/parts/feats.hbs",

        // ITEM
        "modules/pf1e-caravans/templates/item/parts/changes.hbs"
    ]);
}