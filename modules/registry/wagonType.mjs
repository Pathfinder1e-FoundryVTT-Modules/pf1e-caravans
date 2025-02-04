const fields = foundry.data.fields;
const Registry = pf1.registry.Registry;
const RegistryEntry = pf1.registry.RegistryEntry;

export class WagonType extends RegistryEntry {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            cost: new fields.NumberField({required: false, initial: undefined}),
            hp: new fields.NumberField({required: false, initial: undefined}),
            capacity: new fields.SchemaField({
                traveler: new fields.NumberField({required: false, initial: undefined}),
                cargo: new fields.NumberField({required: false, initial: undefined})
            }),
            max: new fields.NumberField({required: false, initial: undefined}),
            consumption: new fields.NumberField({required: false, initial: undefined}),
            _changes: new fields.ArrayField(new fields.SchemaField({
                formula: new fields.StringField({initial: ""}),
                target: new fields.StringField({initial: ""}),
                type: new fields.StringField({initial: ""}),
                operator: new fields.StringField({required: false, initial: undefined}),
                priority: new fields.NumberField({required: false, initial: undefined}),
                continuous: new fields.BooleanField({required: false, initial: undefined}),
            })),
            _contextNotes: new fields.ArrayField(new fields.SchemaField({
                target: new fields.StringField({initial: ""}),
                text: new fields.StringField({initial: ""})
            })),
        }
    }
}

export class WagonTypes extends Registry {
    static model = WagonType;

    static _defaultData = [
        {
            _id: "armoredWagon",
            name: "PF1ECaravans.WagonType.ArmoredWagon",
            cost: 5000,
            hp: 60,
            capacity: {
                traveler: 6,
                cargo: 4
            },
            max: 2,
            consumption: 2,
            _changes: [{
                formula: "3",
                target: "caravan_armorClass",
                type: "untyped"
            }]
        },
        {
            _id: "coveredWagon",
            name: "PF1ECaravans.WagonType.CoveredWagon",
            cost: 500,
            hp: 20,
            capacity: {
                traveler: 6,
                cargo: 4
            },
            consumption: 2
        },
        {
            _id: "fortuneTellerWagon",
            name: "PF1ECaravans.WagonType.FortuneTellerWagon",
            cost: 500,
            hp: 30,
            capacity: {
                traveler: 2,
                cargo: 4
            },
            max: 1,
            consumption: 1,
            _changes: [{
                formula: "1",
                target: "caravan_travelerRoleLimit_fortuneTeller",
                type: "untyped"
            }]
        },
        {
            _id: "horseTrain",
            name: "PF1ECaravans.WagonType.HorseTrain",
            cost: 1200,
            hp: 10,
            capacity: {
                traveler: 6,
                cargo: 1
            },
            max: 3,
            consumption: 6,
            _changes: [{
                formula: "4",
                target: "caravan_speed",
                type: "untyped"
            }]
        },
        {
            _id: "prisonerWagon",
            name: "PF1ECaravans.WagonType.PrisonerWagon",
            cost: 4000,
            hp: 40,
            capacity: {
                traveler: 6,
                cargo: 2
            },
            max: 2,
            consumption: 2,
            _changes: [{
                formula: "2",
                target: "caravan_security",
                type: "untyped"
            }]
        },
        {
            _id: "royalCarriage",
            name: "PF1ECaravans.WagonType.RoyalCarriage",
            cost: 2500,
            hp: 30,
            capacity: {
                traveler: 4,
                cargo: 2
            },
            max: 1,
            consumption: 2,
            _changes: [{
                formula: "if(gt(@travelers.counts.entertainer.count, 0), 4)",
                target: "caravan_resolve",
                type: "untyped"
            }]
        },
        {
            _id: "supplyWagon",
            name: "PF1ECaravans.WagonType.SupplyWagon",
            cost: 300,
            hp: 20,
            capacity: {
                traveler: 2,
                cargo: 10
            },
            consumption: 1
        },
        {
            _id: "custom",
            name: "PF1ECaravans.WagonType.Custom",
        }
    ]
}

export let wagonTypes = new WagonTypes();