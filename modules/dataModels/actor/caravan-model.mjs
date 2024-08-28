import {MODULE_ID} from "../../pf1e-caravans.mjs";

export class CaravanModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            attributes: new fields.SchemaField({
                hp: new fields.SchemaField({
                    value: new fields.NumberField({required: true, default: 0}),
                }),
                unrest: new fields.SchemaField({
                    value: new fields.NumberField({required: true, default: 0})
                }),
                provisions: new fields.NumberField({required: true, default: 0})
            }),
            details: new fields.SchemaField({
                level: new fields.NumberField({required: true, default: 1}),
                notes: new fields.SchemaField({
                    value: new fields.HTMLField({required: false, blank: true}),
                }),
                condition: new fields.StringField({required: true, default: "normal"})
            }),
            statistics: new fields.SchemaField({
                offense: new fields.SchemaField({
                    base: new fields.NumberField({required: true, default: 1})
                }),
                defense: new fields.SchemaField({
                    base: new fields.NumberField({required: true, default: 1})
                }),
                mobility: new fields.SchemaField({
                    base: new fields.NumberField({required: true, default: 1})
                }),
                morale: new fields.SchemaField({
                    base: new fields.NumberField({required: true, default: 1})
                })
            }),
            capacity: new fields.SchemaField({
                cargo: new fields.SchemaField({
                    base: new fields.NumberField({required: true, default: 0})
                }),
                travelers: new fields.SchemaField({
                    base: new fields.NumberField({required: true, default: 0})
                }),
                wagons: new fields.SchemaField({
                    base: new fields.NumberField({required: true, default: 5})
                })
            })
        }
    }

    prepareDerivedData() {

        // DETAILS
        this.details ??= {};
        this.details.level = this.details.level || 1;

        this.details.speed = {base: 32, total: 32};

        this._prepareTravelerCounts();
        this._prepareWagonCounts();
        this._prepareCargoCounts();
        this._prepareFeats();

        // STATISTICS
        for (let statisticKey of ["offense", "defense", "mobility", "morale"]) {
            const statistic = this.statistics[statisticKey] ??= {base: 1};

            statistic.base = Math.min(10, statistic.base);
            statistic.total = Math.min(10, statistic.base);

            this.statistics[statisticKey] = statistic;
        }
        Object.assign(this.statistics, {
            attack: 0,
            armorClass: 10,
            security: 0,
            resolve: 0,
        })

        // ATTRIBUTES
        const wagons = this.parent.itemTypes[`${MODULE_ID}.wagon`];
        const travelers = this.parent.itemTypes[`${MODULE_ID}.traveler`];

        this.attributes ??= {};

        this.attributes.unrest ??= {value: 0, limit: 0};
        this.attributes.unrest.limit ??= 0;
        this.attributes.unrest.value = Math.max(this.attributes.unrest.value, 0);

        this.attributes.hp ??= {max: 0};
        this.attributes.hp.max ??= 0;
        this.attributes.hp.value = Math.max(this.attributes.hp.value, 0);

        this.attributes.consumption = 0;
    }

    _prepareTravelerCounts() {
        const travelers = this.parent.itemTypes[`${MODULE_ID}.traveler`];
        const wagons = this.parent.itemTypes[`${MODULE_ID}.wagon`];
        const owned = travelers.length;

        const wagonCapacity = wagons.reduce((acc, wagon) => {
            return acc + wagon.system.capacity.traveler
        }, 0);

        const result = {
            max: 0,
            count: owned,
            wagons: wagonCapacity,
            heroes: travelers.reduce((acc, traveler) => traveler.system.details.isHero ? acc + 1 : acc, 0),
            formula: 0,
            changes: 0,
            // Count totals
            get discrepancy() {
                return this.max - this.count;
            },
            get missing() {
                return Math.max(0, this.discrepancy);
            },
            get excess() {
                return Math.max(0, -this.discrepancy);
            },
        }

        const travelerTypes = {}
        pf1.registry.travelerRoles.map(travelerRole => {
            travelerTypes[travelerRole.id] = {
                count: 0,
                max: travelerRole.max,
                get discrepancy() {
                    return this.max !== undefined ? this.max - this.count : 0
                },
                get missing() {
                    return this.max !== undefined ? Math.max(0, this.discrepancy) : 0
                },
                get excess() {
                    return this.max !== undefined ? Math.max(0, -this.discrepancy) : 0
                },
            }
        });
        travelers.map(traveler => travelerTypes[traveler.system.subType].count++);
        result.counts = travelerTypes;

        this.travelers = result;
    }

    _prepareWagonCounts() {
        const wagons = this.parent.itemTypes[`${MODULE_ID}.wagon`];
        const owned = wagons.length;

        const result = {
            max: 5,
            count: owned,
            base: 5,
            formula: 0,
            changes: 0,
            // Count totals
            get discrepancy() {
                return this.max - this.count;
            },
            get missing() {
                return Math.max(0, this.discrepancy);
            },
            get excess() {
                return Math.max(0, -this.discrepancy);
            },
        }

        const wagonTypes = {}
        pf1.registry.wagonTypes.map(wagonType => {
            wagonTypes[wagonType.id] = {
                count: 0,
                max: wagonType.max,
                get discrepancy() {
                    return this.max !== undefined ? this.max - this.count : 0
                },
                get missing() {
                    return this.max !== undefined ? Math.max(0, this.discrepancy) : 0
                },
                get excess() {
                    return this.max !== undefined ? Math.max(0, -this.discrepancy) : 0
                },
            }
        });
        wagons.map(wagon => wagonTypes[wagon.system.subType].count++);
        result.counts = wagonTypes;

        this.wagons = result;
    }

    _prepareCargoCounts() {
        const cargo = this.parent.itemTypes[`${MODULE_ID}.equipment`];
        const wagons = this.parent.itemTypes[`${MODULE_ID}.wagon`];
        const owned = cargo.length + Math.ceil(this.attributes.provisions / 10);

        const wagonCapacity = wagons.reduce((acc, wagon) => {
            return acc + wagon.system.capacity.cargo
        }, 0);

        const result = {
            max: 0,
            count: owned,
            wagons: wagonCapacity,
            formula: 0,
            changes: 0,
            // Count totals
            get discrepancy() {
                return this.max - this.count;
            },
            get missing() {
                return Math.max(0, this.discrepancy);
            },
            get excess() {
                return Math.max(0, -this.discrepancy);
            },
        }

        // TODO: Add actual calculation
        this.cargo = result;
    }

    _prepareFeats() {
        const feats = this.parent.itemTypes[`${MODULE_ID}.feat`];

        const owned = feats.length;

        const result = {
            max: 0,
            count: owned,
            levels: this.details.level,
            formula: 0,
            changes: 0,
            // Count totals
            get discrepancy() {
                return this.max - this.count;
            },
            get missing() {
                return Math.max(0, this.discrepancy);
            },
            get excess() {
                return Math.max(0, -this.discrepancy);
            },
        }

        // TODO: Add actual calculation

        this.feats = result;
    }

    get skills() {
        return {};
    }
}