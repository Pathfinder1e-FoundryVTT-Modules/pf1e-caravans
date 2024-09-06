import {MODULE_ID} from "./_moduleId.mjs";
import * as Registry from "./registry/_module.mjs";
import * as Config from "./config/_module.mjs";
import {getChangeFlat} from "./hooks/getChangeFlat.mjs";
import {CaravanModel, EquipmentModel, FeatModel, TravelerModel, WagonModel} from "./dataModels/_module.mjs";
import {CaravanSheet, EquipmentSheet, FeatSheet, TravelerSheet, WagonSheet} from "./applications/_module.mjs";
import {CaravanActor, CaravanItem, EquipmentItem, TravelerItem, WagonItem} from "./documents/_module.mjs";
import {CaravanItemSheet} from "./applications/item/caravan-item-sheet.mjs";

Hooks.once("init", () => {
    registerConfig();
    registerActors();
    registerItems();
    registerTemplates();

    console.log(`${MODULE_ID} | Initialized`);
})

Hooks.once('libWrapper.Ready', () => {
    console.log(`${MODULE_ID} | Registering LibWrapper Hooks`);

    for (let key in pf1.applications.actor) {
        const appClass = pf1.applications.actor[key];
        const appClassName = appClass.prototype.constructor.name;
        if (
            !appClassName?.includes("Sheet")
            || appClassName.includes("Caravan")
            || ["ActorSheetPFBasic", "ActorSheetPF"].includes(appClassName)
        ) continue;

        libWrapper.register(MODULE_ID, `pf1.applications.actor.${appClassName}.prototype._onDropItem`, async function (wrapper, event, data) {
            const sourceItem = await Item.implementation.fromDropData(data);
            if(sourceItem && sourceItem.type.startsWith(`${MODULE_ID}.`)) {
                return void ui.notifications.warn("PF1ECaravans.Errors.CaravanItemsCannotBeAddedToThisActor", { localize: true });
            }
            return wrapper(event, data);
        }, libWrapper.MIXED);
    }

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

    for (const prop of ["buffTargetCategories", "contextNoteCategories"]) {
        for (const categoryKey in pf1.config[prop]) {
            const category = pf1.config[prop][categoryKey];
            category.filters ??= {};
            category.filters.item ??= {};
            category.filters.item.exclude ??= [];
            category.filters.item.exclude.push(`${MODULE_ID}.feat`, `${MODULE_ID}.traveler`, `${MODULE_ID}.wagon`, `${MODULE_ID}.equipment`);
            pf1.config[prop][categoryKey] = category;
        }
    }

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
            label: game.i18n.localize(`PF1.Subtypes.Item.${MODULE_ID}.wagon.${wagonType.id}.Plural`),
            path: `caravanWagon.${wagonType.id}`,
        };
        if (wagonType.max !== undefined) {
            pf1.config.buffTargets[`caravan_wagonLimit_${wagonType.id}`] = {
                label: `PF1ECaravans.BuffTargets.WagonLimit.${wagonType.id}`,
                category: "caravan_wagons",
                sort: 4000 + 10 * buffTargetSort++,
                filters: {item: {include: [`${MODULE_ID}.feat`, `${MODULE_ID}.traveler`, `${MODULE_ID}.wagon`, `${MODULE_ID}.equipment`]}}
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
            label: game.i18n.localize(`PF1.Subtypes.Item.${MODULE_ID}.traveler.${travelerRole.id}.Plural`),
            path: `caravanTraveler.${travelerRole._id}`,
        }

        if (travelerRole.max !== undefined) {
            pf1.config.buffTargets[`caravan_travelerRoleLimit_${travelerRole.id}`] = {
                label: `PF1ECaravans.BuffTargets.TravelerRoleLimit.${travelerRole.id}`,
                category: "caravan_travelers",
                sort: 3000 + 10 * buffTargetSort++,
                filters: {item: {include: [`${MODULE_ID}.feat`, `${MODULE_ID}.traveler`, `${MODULE_ID}.wagon`, `${MODULE_ID}.equipment`]}}
            }
        }
    })
    Object.assign(pf1.config.sheetSections, {
        caravanWagon: caravanWagonSections,
        caravanTraveler: caravanTravelerSections
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

    Object.assign(pf1.applications.actor, {
        CaravanSheet: CaravanSheet
    })
    for (let [type, sheet] of Object.entries(actorSheets)) {
        DocumentSheetConfig.registerSheet(Actor, MODULE_ID, sheet, {
            types: [type],
            makeDefault: true
        });
    }
}

function registerItems() {
    Object.assign(CONFIG.Item.documentClasses, {
        [`${MODULE_ID}.equipment`]: EquipmentItem,
        [`${MODULE_ID}.feat`]: CaravanItem,
        [`${MODULE_ID}.traveler`]: TravelerItem,
        [`${MODULE_ID}.wagon`]: WagonItem,
    })
    Object.assign(pf1.documents.item, {
        CaravanItem: CaravanItem,
        CaravanTravelerItem: TravelerItem,
        CaravanWagonItem: WagonItem,
        CaravanEquipmentItem: EquipmentItem,
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

    Object.assign(pf1.applications.item, {
        CaravanItemSheet: CaravanItemSheet,
        CaravanEquipmentSheet: EquipmentSheet,
        CaravanFeatSheet: FeatSheet,
        CaravanTravelerSheet: TravelerSheet,
        CaravanWagonSheet: WagonSheet
    })

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
        `modules/${MODULE_ID}/templates/actor/caravan/parts/cargo.hbs`,
        `modules/${MODULE_ID}/templates/actor/caravan/parts/summary.hbs`,
        `modules/${MODULE_ID}/templates/actor/caravan/parts/travelers.hbs`,
        `modules/${MODULE_ID}/templates/actor/caravan/parts/wagons.hbs`,
        `modules/${MODULE_ID}/templates/actor/caravan/parts/feats.hbs`,

        // ITEM
        `modules/${MODULE_ID}/templates/item/parts/changes.hbs`
    ]);
}