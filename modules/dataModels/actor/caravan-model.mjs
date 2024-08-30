import {MODULE_ID} from "../../_moduleId.mjs";

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

        this._prepareTravelers();
        this._prepareWagons();
        this.cargo = {max: 0};
        this.feats = {max: this.details.level}

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
        this.attributes ??= {};

        this.attributes.unrest ??= {value: 0, limit: 0};
        this.attributes.unrest.limit ??= 0;
        this.attributes.unrest.value = Math.max(this.attributes.unrest.value, 0);

        this.attributes.hp ??= {max: 0};
        this.attributes.hp.max ??= 0;
        this.attributes.hp.value = Math.max(this.attributes.hp.value, 0);

        this.attributes.consumption = 0;
        this.details.wages = 0;
    }

    _prepareTravelers() {
        const travelers = this.parent.itemTypes[`${MODULE_ID}.traveler`];
        const wagons = this.parent.itemTypes[`${MODULE_ID}.wagon`];

        const travelerTypes = {}
        pf1.registry.travelerRoles.map(travelerRole => travelerTypes[travelerRole.id] = {count: 0, max: travelerRole.max});
        travelers.map(traveler => travelerTypes[traveler.system.subType].count++);

        this.travelers = {
            max: 0,
            counts: travelerTypes
        };
    }

    _prepareWagons() {
        const wagons = this.parent.itemTypes[`${MODULE_ID}.wagon`];

        const wagonTypes = {}
        pf1.registry.wagonTypes.map(wagonType => wagonTypes[wagonType.id] = {count: 0, max: wagonType.max});
        wagons.map(wagon => wagonTypes[wagon.system.subType].count++);

        this.wagons = {
            max: 5,
            counts: wagonTypes,
        };
    }

    get skills() {
        return {};
    }
}