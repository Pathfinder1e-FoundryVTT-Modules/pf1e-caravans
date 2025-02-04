import {MODULE_ID} from "../../_moduleId.mjs";
import {toCamelCase} from "../../util/util.mjs";
import {CaravanRestDialog} from "./caravan-rest.mjs";
import {CaravanConvertTreasure} from "./caravan-convert-treasure.mjs";

export class CaravanSheet extends pf1.applications.actor.ActorSheetPF {
    static get defaultOptions() {
        const options = super.defaultOptions;
        return {
            ...options,
            classes: [...options.classes, "pf1", "actor", "caravan"],
            width: 900,
            height: 800,
            tabs: [{navSelector: "nav.tabs", contentSelector: "section.primary-body", initial: "summary"}],
            scrollY: [".tab.summary"],
        };
    }

    get template() {
        return `modules/${MODULE_ID}/templates/actor/caravan/${this.isEditable ? "edit" : "view"}.hbs`;
    }

    activateListeners(html) {
        super.activateListeners(html);
        // html.find(".attribute.attack .rollable").on("click", this._onRollAttack.bind(this));
        html.find(".attribute:is(.security, .resolve) .rollable").on("click", this._onRollAttribute.bind(this));
        html.find(".item-convert-to-gold").on("click", this._onConvertTreasure.bind(this));
    }

    _focusTabByItem(item) {
        let tabId;
        switch(item.type) {
            case `${MODULE_ID}.feat`:
                tabId = "feats";
                break;

            case `${MODULE_ID}.wagon`:
                tabId = "wagons";
                break;

            case `${MODULE_ID}.traveler`:
                tabId = "travelers";
                break;

            default:
                tabId = "cargo";
        }

        if (tabId) this.activateTab(tabId, "primary");
    }

    async _onDropItem(event, data) {
        const sourceItem = await Item.implementation.fromDropData(data);
        if(
            !sourceItem.type.startsWith(`${MODULE_ID}.`)
            && !["container", "equipment", "implant", "loot", "weapon"].includes(sourceItem.type)
        ) {
            return void ui.notifications.warn("PF1ECaravans.Errors.OnlyCaravanItemsAndActorEquipmentCanBeAddedToThisActor", { localize: true });
        }

        return super._onDropItem(event, data);
    }

    async _onRollAttack(event) {
        event.preventDefault();
        await this.actor.rollAttack({token: this.token});
    }

    async _onRollAttribute(event) {
        event.preventDefault();
        const attribute = event.currentTarget.closest(".attribute").dataset.attribute;
        await this.actor.rollAttributeTest(attribute, {token: this.token});
    }

    get conditions() {
        const conditions = [];
        if (this.actor.system.attributes.unrest.value > this.actor.system.attributes.unrest.limit) {
            conditions.push({
                key: "mutiny",
                label: "PF1ECaravans.Conditions.Mutiny",
                icon: `modules/${MODULE_ID}/icons/fist.svg`
            })
        }
        if (this.actor.system.details.condition !== "normal") {
            conditions.push({
                key: this.actor.system.details.condition,
                label: game.i18n.localize(`PF1ECaravans.Conditions.${this.actor.system.details.condition.capitalize()}`),
                icon: (this.actor.system.details.condition === "fatigued" ? "icons/svg/unconscious.svg" : "systems/pf1/icons/conditions/exhausted.svg")
            })
        }
        if (this.actor.getCargoCount().excess > 0) {
            conditions.push({
                key: this.actor.system.details.condition,
                label: game.i18n.localize(`PF1ECaravans.Conditions.Overloaded`),
                icon: `modules/${MODULE_ID}/icons/push.svg`
            })
        }
        if (
            this.actor.system.details.speed.total <= 0
            || this.actor.getCargoCount().excess > 0
            || this.actor.getTravelerCount().excess > 0
        ) {
            conditions.push({
                key: this.actor.system.details.condition,
                label: game.i18n.localize(`PF1ECaravans.Conditions.Immobilized`),
                icon: `modules/${MODULE_ID}/icons/nailed-foot.svg`
            })
        }
        // TODO: Starving
        return conditions;
    }

    async getData(options = {}) {
        const isOwner = this.actor.isOwner;
        const isMetricDist = pf1.utils.getDistanceSystem() === "metric";

        const context = {
            actor: this.actor,
            document: this.actor,
            system: this.actor.system,
            owner: isOwner,
            itemTypes: this.actor.itemTypes,
            limited: this.actor.limited,
            editable: this.isEditable,
            cssClass: isOwner ? "editable" : "locked",
            config: pf1.config,
            isGM: game.user.isGM,
            conditionOptions: {
                normal: "PF1ECaravans.Conditions.Normal",
                fatigued: "PF1ECaravans.Conditions.Fatigued",
                exhausted: "PF1ECaravans.Conditions.Exhausted",
            },
            conditions: this.conditions,
            units: {
                weight:
                    pf1.utils.getWeightSystem() === "metric" ? game.i18n.localize("PF1.Kgs") : game.i18n.localize("PF1.Lbs"),
                distance: {
                    tactical: isMetricDist ? pf1.config.measureUnitsShort.m : pf1.config.measureUnitsShort.ft,
                    overland: isMetricDist ? pf1.config.measureUnitsShort.km : pf1.config.measureUnitsShort.mi,
                },
            },
            notesHTML: await TextEditor.enrichHTML(this.actor.system.details.notes.value || "", {
                async: true,
                secrets: this.object.isOwner,
                relativeTo: this.object
            }),
        };

        context.hasCurrency = Object.values(this.actor.system.currency).some((o) => o > 0);

        // Feat Counts
        {
            const feats = this.actor.getFeatCount();
            feats.bonus = feats.formula + feats.changes;
            feats.issues = 0;
            if (feats.missing > 0 || feats.excess) feats.issues += 1;
            if (feats.disabled > 0) feats.issues += 1;
            context.featCount = feats;
        }

        // Cargo Counts
        {
            const cargo = this.actor.getCargoCount();
            cargo.bonus = cargo.formula + cargo.changes;
            cargo.issues = 0;
            if (cargo.missing > 0 || cargo.excess) cargo.issues += 1;
            if (cargo.disabled > 0) cargo.issues += 1;
            context.cargoCount = cargo;
            context.cargoDetails = this._computeCargoDetails(cargo);
        }

        // Wagon Counts
        {
            const wagons = this.actor.getWagonCount();
            wagons.bonus = wagons.formula + wagons.changes;
            wagons.issues = 0;
            if (wagons.missing > 0 || wagons.excess) wagons.issues += 1;
            if (wagons.disabled > 0) wagons.issues += 1;
            context.wagonCount = wagons;
        }

        // Traveler Counts
        {
            const travelers = this.actor.getTravelerCount();
            travelers.bonus = travelers.formula + travelers.changes;
            travelers.issues = 0;
            if (travelers.missing > 0 || travelers.excess) travelers.issues += 1;
            if (travelers.disabled > 0) travelers.issues += 1;
            context.travelerCount = travelers;
        }

        // Prepare owned items
        this._prepareItems(context);

        context.speedConverted = pf1.utils.convertDistance(this.actor.system.details.speed.total, "mi")[0];

        return context;
    }

    _prepareItems(data) {
        let wagonSections = [];
        for (let section of Object.values(pf1.config.sheetSections.caravanWagon)) {
            const count = this.actor.getWagonCount().counts[section.id];
            section.items = this.actor.itemTypes[`${MODULE_ID}.wagon`].filter((item) => item.system.subType === section.id);
            section.interface.max = count.max;
            section.interface.hasMax = section.interface.max !== undefined;
            section.interface.excess = count.excess;
            wagonSections.push(section);
        }

        let travelerSections = [];
        for (let section of Object.values(pf1.config.sheetSections.caravanTraveler)) {
            const count = this.actor.getTravelerCount().counts[section.id];
            section.items = this.actor.itemTypes[`${MODULE_ID}.traveler`].filter((item) => item.system.subType === section.id);
            section.interface.max = count.max;
            section.interface.hasMax = section.interface.max !== undefined;
            section.interface.excess = count.excess;
            travelerSections.push(section);
        }

        let featSections = pf1.config.sheetSections.caravanFeat;
        for (let section of Object.values(pf1.config.sheetSections.caravanFeat)) {
            section.items = this.actor.itemTypes[`${MODULE_ID}.feat`].filter((item) => item.system.subType === section.id);
        }
        featSections.feat.interface.excess = this.actor.getFeatCount().excess;
        featSections = Object.values(featSections);

        let cargoSections = pf1.config.sheetSections.caravanCargo;
        cargoSections.equipment.items = this.actor.itemTypes[`${MODULE_ID}.equipment`];
        cargoSections.treasure.items = this.actor.items.filter((item) => !item.type.startsWith(`${MODULE_ID}.`));
        cargoSections = Object.values(cargoSections);

        const categories = [
            {key: "wagons", sections: wagonSections},
            {key: "travelers", sections: travelerSections},
            {key: "feats", sections: featSections},
            {key: "cargo", sections: cargoSections}
        ];

        for (const {key, sections} of categories) {
            const set = this._filters.sections[key];
            for (const section of sections) {
                if (!section) continue;
                section._hidden = set?.size > 0 && !set.has(section.id);
            }
        }

        data.wagons = wagonSections;
        data.travelers = travelerSections;
        data.feats = featSections;
        data.cargo = cargoSections;
    }

    _getTooltipContext(fullId, context) {
        const actor = this.actor,
            system = actor.system;

        // Lazy roll data
        const lazy = {
            get rollData() {
                this._rollData ??= actor.getRollData();
                return this._rollData;
            },
        };

        const getNotes = (context, all = true) => {
            const noteObjs = actor.getContextNotes(context, all);
            return actor.formatContextNotes(noteObjs, lazy.rollData, {roll: false});
        };

        let header, subHeader;
        const details = [];
        const paths = [];
        const sources = [];
        let notes;

        const re = /^(?<id>[\w-]+)(?:\.(?<detail>.*))?$/.exec(fullId);
        const {id, detail} = re?.groups ?? {};

        switch (id) {
            case "speed": {
                const mode = detail;
                sources.push({
                    sources: this.actor.getSourceDetails("system.details.speed.total"),
                    untyped: true,
                }, {
                    sources: this.actor.getSourceDetails("system.details.speed.base"),
                    untyped: true,
                });

                // Add base speed
                const speed = system.details.speed;
                const [tD] = pf1.utils.convertDistance(speed.total, "mi");
                const [tB] = pf1.utils.convertDistance(speed.base, "mi");

                const isMetricDist = pf1.utils.getDistanceSystem() === "metric";
                const oU = isMetricDist ? pf1.config.measureUnitsShort.km : pf1.config.measureUnitsShort.mi;

                paths.push({
                    path: "@details.speed.total",
                    value: tD,
                    unit: oU
                }, {
                    path: "@details.speed.base",
                    value: tB,
                    unit: oU
                })

                break;
            }

            case "unrest": {
                paths.push({
                    path: "@attributes.unrest.limit",
                    value: system.attributes.unrest.limit,
                }, {
                    path: "@attributes.unrest.value",
                    value: system.attributes.unrest.value,
                })

                sources.push({
                    sources: this.actor.getSourceDetails("system.attributes.unrest.limit"),
                    untyped: true,
                });
                break;
            }

            case "hit-points": {
                paths.push({
                    path: "@attributes.hp.max",
                    value: system.attributes.hp.max,
                }, {
                    path: "@attributes.hp.value",
                    value: system.attributes.hp.value,
                })

                sources.push({
                    sources: this.actor.getSourceDetails("system.attributes.hp.max"),
                    untyped: true,
                });
                break;
            }

            case "consumption": {
                const consumption = system.attributes.consumption;
                paths.push({
                    path: "@attributes.consumption",
                    value: consumption,
                }, {
                    path: "@attributes.provisions",
                    value: system.attributes.provisions,
                });

                sources.push({
                    sources: this.actor.getSourceDetails("system.attributes.consumption"),
                    untyped: true,
                });
                break;
            }

            case "offense":
            case "defense":
            case "mobility":
            case "morale": {
                const attribute = system.statistics[id];
                paths.push({
                    path: `@statistics.${id}.total`,
                    value: attribute.total,
                }, {
                    path: `@statistics.${id}.base`,
                    value: attribute.base,
                });

                sources.push({
                    sources: this.actor.getSourceDetails(`system.statistics.${id}.total`),
                    untyped: true,
                });
                break;
            }

            case "attack":
            case "armor-class":
            case "security":
            case "resolve": {
                const proxyId = toCamelCase(id);
                const attribute = system.statistics[proxyId];
                paths.push({
                    path: `@statistics.${proxyId}`,
                    value: attribute,
                });

                sources.push({
                    sources: this.actor.getSourceDetails(`system.statistics.${proxyId}`),
                    untyped: true,
                });

                notes = getNotes(`caravan_${id}`);
                break;
            }

            case "feats":
                sources.push({
                    sources: this.actor.getSourceDetails(`system.feats.max`),
                    untyped: true,
                });
                break;

            case "wagons":
            case "travelers":
            case "cargo": {
                const attribute = system[id];
                paths.push({
                    path: `@${id}.max`,
                    value: attribute.max,
                }, {
                    path: `@${id}.owned`,
                    value: attribute.owned,
                });

                sources.push({
                    sources: this.actor.getSourceDetails(`system.${id}.max`),
                    untyped: true,
                });
                break;
            }

            // TODO: add cases
            default:
                throw new Error(`Invalid extended tooltip identifier "${fullId}"`);
        }

        context.header = header;
        context.subHeader = subHeader;
        context.details = details;
        context.paths = paths;
        context.sources = sources;
        context.notes = notes ?? [];
    }

    _computeCargoDetails(cargoCount) {
        const cargo = {};

        const weightSystem = pf1.utils.getWeightSystem();
        const treasure = this.actor.items.filter((item) => !item.type.startsWith(`${MODULE_ID}.`))
        const treasureWeight = treasure.reduce((acc, item) => acc + item.system.weight.total, 0);
        const treasureCount = Math.ceil(treasureWeight / 50);
        const treasureWorth = treasure.reduce((acc, item) => acc + item.system.price * item.system.quantity, 0);

        const stores = Math.ceil(this.actor.system.attributes.provisions / 10);

        cargo.percentage = {
            equipment: Math.min(Math.round((cargoCount.owned - stores - treasureCount) * 100 / cargoCount.max), 99.5),
            stores: Math.min(Math.round((cargoCount.owned - treasureCount) * 100 / cargoCount.max), 99.5),
            treasure: Math.min(Math.round(cargoCount.owned * 100 / cargoCount.max), 99.5)
        };

        cargo.encumbered = cargoCount.excess > 0;

        cargo.labels = [
            this.actor.system.attributes.provisions
                ? game.i18n.format("PF1ECaravans.CargoLabels.ProvisionsInStores", {
                    provisions: this.actor.system.attributes.provisions,
                    stores: stores
                })
                : null,
            this.actor.system.attributes.provisions
                ? game.i18n.format("PF1ECaravans.CargoLabels.WorthOfProvisions", pf1.utils.currency.split(50 * this.actor.system.attributes.provisions, {
                    omit: ["pp", "cp"],
                    standard: false
                }))
                : null,
            treasureCount
                ? game.i18n.format(weightSystem === "metric" ? "PF1ECaravans.CargoLabels.KGofTreasure" : "PF1ECaravans.CargoLabels.LBSofTreasure", {
                    weight: pf1.utils.convertWeight(treasureWeight),
                    treasure: treasureCount
                })
                : null,
            treasureCount
                ? game.i18n.format("PF1ECaravans.CargoLabels.WorthOfTreasure",
                    pf1.utils.currency.split(100 * treasureWorth, {omit: ["pp"], standard: false}))
                : null
        ].filter((o) => !!o);

        return cargo;
    }

    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        switch (data.type) {
            case "Actor":
                await this.actor.createEmbeddedDocuments("Item", [{
                    type: `${MODULE_ID}.traveler`,
                    name: data.uuid,
                    system: {
                        subType: "passenger",
                        actorId: data.uuid
                    }
                }])
                break;

            default:
                return super._onDrop(event);
        }
    }

    async _onRest(event) {
        event.preventDefault();

        const skipDialog = pf1.documents.settings.getSkipActionPrompt();
        if (skipDialog) {
            const button = event.currentTarget;
            button.disabled = true;
            try {
                await this.actor.performRest({verbose: true});
            } finally {
                button.disabled = false;
            }
        } else {
            const app = Object.values(this.actor.apps).find((o) => {
                return o instanceof CaravanRestDialog && o._element;
            });
            if (app) app.render(true, {focus: true});
            else new CaravanRestDialog(this.actor).render(true);
        }
    }

    async _onConvertTreasure(event) {
        event.preventDefault();

        const treasure = this.actor.items.filter((item) => !item.type.startsWith(`${MODULE_ID}.`) && item.system.quantity);
        if (!treasure.length) {
            ui.notifications.warn(game.i18n.localize("PF1ECaravans.Errors.NoTreasureToConvert"));
            return;
        }

        const skipDialog = pf1.documents.settings.getSkipActionPrompt();
        if (skipDialog) {
            const button = event.currentTarget;
            button.disabled = true;
            try {
                await this.actor.convertTreasure({verbose: true});
            } finally {
                button.disabled = false;
            }
        } else {
            const app = Object.values(this.actor.apps).find((o) => {
                return o instanceof CaravanConvertTreasure && o._element;
            });
            if (app) app.render(true, {focus: true});
            else new CaravanConvertTreasure(this.actor).render(true);
        }
    }
}