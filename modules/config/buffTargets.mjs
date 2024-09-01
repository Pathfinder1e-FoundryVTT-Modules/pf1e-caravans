import {MODULE_ID} from "../_moduleId.mjs";

export const buffTargets = {
    caravan_hp: {
        category: "caravan_attributes",
        label: "PF1ECaravans.BuffTargets.HP",
        sort: 100
    },
    caravan_wages: {
        category: "caravan_attributes",
        label: "PF1ECaravans.BuffTargets.Wages",
        sort: 200
    },
    caravan_speed: {
        category: "caravan_attributes",
        label: "PF1ECaravans.BuffTargets.Speed",
        sort: 300
    },
    caravan_consumption: {
        category: "caravan_attributes",
        label: "PF1ECaravans.BuffTargets.Consumption",
        sort: 400
    },
    caravan_damage: {
        category: "caravan_attributes",
        label: "PF1ECaravans.BuffTargets.Damage",
        sort: 500,
        deferred: true
    },
    caravan_feats: {
        category: "caravan_attributes",
        label: "PF1ECaravans.BuffTargets.Feats",
        sort: 600
    },
    caravan_cargo: {
        category: "caravan_attributes",
        label: "PF1ECaravans.BuffTargets.Cargo",
        sort: 700
    },
    caravan_offense: {
        category: "caravan_statistics",
        label: "PF1ECaravans.BuffTargets.Offense",
        sort: 1000
    },
    caravan_defense: {
        category: "caravan_statistics",
        label: "PF1ECaravans.BuffTargets.Defense",
        sort: 1100
    },
    caravan_mobility: {
        category: "caravan_statistics",
        label: "PF1ECaravans.BuffTargets.Mobility",
        sort: 1200
    },
    caravan_morale: {
        category: "caravan_statistics",
        label: "PF1ECaravans.BuffTargets.Morale",
        sort: 1300
    },
    caravan_attack: {
        category: "caravan_statistics",
        label: "PF1ECaravans.BuffTargets.Attack",
        sort: 1400
    },
    caravan_armorClass: {
        category: "caravan_statistics",
        label: "PF1ECaravans.BuffTargets.ArmorClass",
        sort: 1500
    },
    caravan_security: {
        category: "caravan_statistics",
        label: "PF1ECaravans.BuffTargets.Security",
        sort: 1600
    },
    caravan_resolve: {
        category: "caravan_statistics",
        label: "PF1ECaravans.BuffTargets.Resolve",
        sort: 1700
    },
    caravan_unrest: {
        category: "caravan_statistics",
        label: "PF1ECaravans.BuffTargets.Unrest",
        sort: 1800
    },
    caravan_travelers: {
        category: "caravan_travelers",
        label: "PF1ECaravans.BuffTargets.Travelers",
        sort: 3000
    },
    caravan_wagons: {
        category: "caravan_wagons",
        label: "PF1ECaravans.BuffTargets.Wagons",
        sort: 4000
    }
}

export const buffTargetCategories = {
    caravan_attributes: {
        label: "PF1ECaravans.BuffTargetCategories.Attributes",
        sort: 1000,
        filters: {item: {include: [`${MODULE_ID}.feat`, `${MODULE_ID}.traveler`, `${MODULE_ID}.wagon`, `${MODULE_ID}.equipment`]}}
    },
    caravan_statistics: {
        label: "PF1ECaravans.BuffTargetCategories.Statistics",
        sort: 2000,
        filters: {item: {include: [`${MODULE_ID}.feat`, `${MODULE_ID}.traveler`, `${MODULE_ID}.wagon`, `${MODULE_ID}.equipment`]}}
    },
    caravan_travelers: {
        label: "PF1ECaravans.BuffTargetCategories.Travelers",
        sort: 3000,
        filters: {item: {include: [`${MODULE_ID}.feat`, `${MODULE_ID}.traveler`, `${MODULE_ID}.wagon`, `${MODULE_ID}.equipment`]}}
    },
    caravan_wagons: {
        label: "PF1ECaravans.BuffTargetCategories.Wagons",
        sort: 4000,
        filters: {item: {include: [`${MODULE_ID}.feat`, `${MODULE_ID}.traveler`, `${MODULE_ID}.wagon`, `${MODULE_ID}.equipment`]}}
    }
}