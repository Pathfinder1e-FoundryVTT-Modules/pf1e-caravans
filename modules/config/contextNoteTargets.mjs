import {MODULE_ID} from "../_moduleId.mjs";

export const contextNoteTargets = {
    caravan_attack: { label: "PF1ECaravans.ContextNoteTargets.Attack", category: "caravan_statistics" },
    caravan_rest: { label: "PF1ECaravans.ContextNoteTargets.Rest", category: "caravan_statistics" },
    caravan_resolve: { label: "PF1ECaravans.ContextNoteTargets.Resolve", category: "caravan_statistics" },
    caravan_security: { label: "PF1ECaravans.ContextNoteTargets.Security", category: "caravan_statistics" },
};

export const contextNoteCategories = {
    caravan_statistics: {
        label: "PF1ECaravans.ContextNoteTargetCategories.Statistics",
        sort: 1000,
        filters: {item: {include: [`${MODULE_ID}.feat`, `${MODULE_ID}.traveler`, `${MODULE_ID}.wagon`, `${MODULE_ID}.equipment`]}}
    }
};