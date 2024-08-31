import {MODULE_ID} from "../../_moduleId.mjs";

export class CaravanModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            attributes: new fields.SchemaField({
                hp: new fields.SchemaField({
                    value: new fields.NumberField({required: true, initial: 0}),
                }),
                unrest: new fields.SchemaField({
                    value: new fields.NumberField({required: true, initial: 0})
                }),
                provisions: new fields.NumberField({required: true, initial: 0})
            }),
            details: new fields.SchemaField({
                level: new fields.NumberField({required: true, initial: 1}),
                notes: new fields.SchemaField({
                    value: new fields.HTMLField({required: false, blank: true}),
                }),
                condition: new fields.StringField({required: true, initial: "normal"})
            }),
            statistics: new fields.SchemaField({
                offense: new fields.SchemaField({
                    base: new fields.NumberField({required: true, initial: 1})
                }),
                defense: new fields.SchemaField({
                    base: new fields.NumberField({required: true, initial: 1})
                }),
                mobility: new fields.SchemaField({
                    base: new fields.NumberField({required: true, initial: 1})
                }),
                morale: new fields.SchemaField({
                    base: new fields.NumberField({required: true, initial: 1})
                })
            }),
            capacity: new fields.SchemaField({
                cargo: new fields.SchemaField({
                    base: new fields.NumberField({required: true, initial: 0})
                }),
                travelers: new fields.SchemaField({
                    base: new fields.NumberField({required: true, initial: 0})
                }),
                wagons: new fields.SchemaField({
                    base: new fields.NumberField({required: true, initial: 5})
                })
            }),
            currency: new fields.SchemaField({
                pp: new fields.NumberField({required: true, initial: 0}),
                gp: new fields.NumberField({required: true, initial: 0}),
                sp: new fields.NumberField({required: true, initial: 0}),
                cp: new fields.NumberField({required: true, initial: 0})
            })
        }
    }

    prepareDerivedData() {
        super.prepareDerivedData();

        // DETAILS
        this.details ??= {};
        this.details.level = this.details.level || 1;

        this.details.speed = {base: 32, total: 32};

        this._prepareTravelers();
        this._prepareWagons();
        this._prepareCargo();
        this.feats = {
            max: 0,
            owned: this.parent.itemTypes[`${MODULE_ID}.feat`].filter(feat => feat.system.subType === "feat").length
        }

        this.currency ??= {pp: 0, gp: 0, sp: 0, cp: 0};

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

    _prepareCargo() {
        const equipment = this.parent.itemTypes[`${MODULE_ID}.equipment`];
        const treasure = this.parent.items.filter((item) => !item.type.startsWith(`${MODULE_ID}.`));

        const owned = equipment.reduce((acc, cur) => acc + cur.system.units.total, 0)
            + Math.ceil(treasure.reduce((acc, cur) => acc + cur.system.weight.total, 0) / 50)
            + Math.ceil(this.attributes.provisions / 10);

        this.cargo = {
            max: 0,
            owned
        };
    }

    _prepareTravelers() {
        const travelers = this.parent.itemTypes[`${MODULE_ID}.traveler`];
        const wagons = this.parent.itemTypes[`${MODULE_ID}.wagon`];

        const travelerTypes = {}
        pf1.registry.travelerRoles.map(travelerRole => travelerTypes[travelerRole.id] = {
            count: 0,
            max: travelerRole.max
        });
        travelers.map(traveler => travelerTypes[traveler.system.subType].count++);

        this.travelers = {
            max: 0,
            owned: travelers.length,
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
            owned: wagons.length,
            counts: wagonTypes,
        };
    }

    get skills() {
        return {};
    }
}