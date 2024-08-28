import { MODULE_ID } from "../../pf1e-caravans.mjs";
import {toCamelCase} from "../../util/util.mjs";

export class CaravanSheet extends pf1.applications.actor.ActorSheetPF {
    static get defaultOptions() {
        const options = super.defaultOptions;
        return {
            ...options,
            classes: [...options.classes, "pf1", "actor", "caravan"],
            width: 900,
            height: 800,
            tabs: [{ navSelector: "nav.tabs", contentSelector: "section.primary-body", initial: "summary" }],
            scrollY: [".tab.summary"],
        };
    }

    get template() {
        return `modules/pf1e-caravans/templates/actor/caravan/${this.isEditable ? "edit" : "view"}.hbs`;
    }

    async getData(options = {}) {
        const isOwner = this.actor.isOwner;
        const isMetricDist = pf1.utils.getDistanceSystem() === "metric";

        const context = {
            actor: this.actor,
            document: this.actor,
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
            })
        };

        // Prepare owned items
        this._prepareItems(context);

        // Feat Counts
        {
            const feats = this.actor.system.feats;
            feats.bonus = feats.formula + feats.changes;
            feats.issues = 0;
            if(feats.missing > 0 || feats.excess) feats.issues += 1;
            if(feats.disabled > 0) feats.issues += 1;
            context.featCount = feats;
        }

        // Cargo Counts
        {
            const cargo = this.actor.system.cargo;
            cargo.bonus = cargo.formula + cargo.changes;
            cargo.issues = 0;
            if(cargo.missing > 0 || cargo.excess) cargo.issues += 1;
            if(cargo.disabled > 0) cargo.issues += 1;
            context.cargoCount = cargo;
        }

        // Wagon Counts
        {
            const wagons = this.actor.system.wagons;
            wagons.bonus = wagons.formula + wagons.changes;
            wagons.issues = 0;
            if(wagons.missing > 0 || wagons.excess) wagons.issues += 1;
            if(wagons.disabled > 0) wagons.issues += 1;
            context.wagonCount = wagons;
        }

        // Traveler Counts
        {
            const travelers = this.actor.system.travelers;
            travelers.bonus = travelers.formula + travelers.changes;
            travelers.issues = 0;
            if(travelers.missing > 0 || travelers.excess) travelers.issues += 1;
            if(travelers.disabled > 0) travelers.issues += 1;
            context.travelerCount = travelers;
        }

        context.speedConverted = pf1.utils.convertDistance(this.actor.system.details.speed.total, "mi")[0];

        return context;
    }

    _prepareItems(data) {
        let wagonSections = [];
        for(let section of Object.values(pf1.config.sheetSections.caravanWagon)) {
            section.items = this.actor.itemTypes[`${MODULE_ID}.wagon`].filter((item) => item.system.subType === section.id);
            section.interface.max = this.actor.system.wagons.counts[section.id].max;
            section.interface.excess = this.actor.system.wagons.counts[section.id].excess;
            wagonSections.push(section);
        }

        let travelerSections = [];
        for(let section of Object.values(pf1.config.sheetSections.caravanTraveler)) {
            section.items = this.actor.itemTypes[`${MODULE_ID}.traveler`].filter((item) => item.system.subType === section.id);
            section.interface.max = this.actor.system.travelers.counts[section.id].max;
            section.interface.excess = this.actor.system.travelers.counts[section.id].excess;
            travelerSections.push(section);
        }

        const categories = [
            { key: "wagons", sections: wagonSections },
            { key: "travelers", sections: travelerSections },
        ];

        for (const { key, sections } of categories) {
            const set = this._filters.sections[key];
            for (const section of sections) {
                if (!section) continue;
                section._hidden = set?.size > 0 && !set.has(section.id);
            }
        }

        data.wagons = wagonSections;
        data.travelers = travelerSections;
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

        const getSource = (path) => this.actor.sourceDetails[path];

        const getNotes = (context, all = true) => {
            const noteObjs = actor.getContextNotes(context, all);
            return actor.formatContextNotes(noteObjs, lazy.rollData, { roll: false });
        };

        let header, subHeader;
        const details = [];
        const paths = [];
        const sources = [];
        let notes;

        const re = /^(?<id>[\w-]+)(?:\.(?<detail>.*))?$/.exec(fullId);
        const { id, detail } = re?.groups ?? {};

        switch (id) {
            case "speed": {
                const mode = detail;
                sources.push({
                    sources: getSource("system.details.speed.total"),
                    untyped: true,
                },{
                    sources: getSource("system.details.speed.base"),
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
                    sources: getSource("system.attributes.unrest.limit"),
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
                    sources: getSource("system.attributes.hp.max"),
                    untyped: true,
                });
                break;
            }

            case "consumption": {
                const consumption = system.attributes.consumption;
                paths.push({
                    path: "@attributes.consumption",
                    value: consumption,
                });

                sources.push({
                    sources: getSource("system.attributes.consumption"),
                    untyped: true,
                });
                break;
            }

            case "travelers":
            case "wagons":
            case "cargo": {
                const value = system[id];
                paths.push({
                    path: `@${id}.max`,
                    value: value.max,
                }, {
                    path: `@${id}.count`,
                    value: value.count,
                }, {
                    path: `@${id}.missing`,
                    value: value.missing,
                }, {
                    path: `@${id}.excess`,
                    value: value.excess,
                });

                sources.push({
                    sources: getSource(`system.${id}.max`),
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
                    sources: getSource(`system.statistics.${id}.total`),
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
                    sources: getSource(`system.statistics.${proxyId}`),
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
}