const fields = foundry.data.fields;
const Registry = pf1.registry.Registry;
const RegistryEntry = pf1.registry.RegistryEntry;

export class TravelerRole extends RegistryEntry {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            monthlyWage: new fields.NumberField({required: false, initial: undefined}),
            max: new fields.NumberField({required: false, initial: undefined}),
            onlyParty: new fields.BooleanField({initial: false}),
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
            tasks: new fields.ArrayField(new fields.SchemaField({
                id: new fields.StringField({required: true, initial: ""}),
                name: new fields.StringField({ required: true, blank: false, initial: "", localize: true }),
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
                }))
            }))
        }
    }

    localize() {
        // Localize fields marked for localization
        const handleLocalization = (obj, objFields) => {
            for (const [name, field] of Object.entries(objFields)) {
                if (field instanceof fields.StringField && field.options.localize === true)
                    obj[name] = game.i18n.localize(obj[name]);

                if(field instanceof fields.SchemaField) {
                    handleLocalization(obj[name], field.fields);
                }

                if(field instanceof fields.ArrayField) {
                    if(field.element instanceof fields.SchemaField) {
                        obj[name] = obj[name].map((item) => {
                            handleLocalization(item, field.element.fields);
                            return item;
                        });
                    }

                    if(field.element instanceof fields.StringField && field.element.options.localize === true) {
                        obj[name] = obj[name].map((item) => game.i18n.localize(item));
                    }
                }
            }
        }
        handleLocalization(this, this.constructor.schema.fields);
    }
}

export class TravelerRoles extends Registry {
    static model = TravelerRole;

    static _defaultData = [
        {
            _id: "cook",
            name: "PF1ECaravans.TravelerRole.Cook",
            monthlyWage: 10,
            max: 5,
            _changes: [{
                formula: "if(gte(@attributes.provisions, 10), -2)",
                target: "caravan_consumption",
                type: "circumstance"
            }]
        },
        {
            _id: "driver",
            name: "PF1ECaravans.TravelerRole.Driver",
            monthlyWage: 10
        },
        {
            _id: "entertainer",
            name: "PF1ECaravans.TravelerRole.Entertainer",
            monthlyWage: 50,
            _changes: [{
                formula: "1",
                target: "caravan_resolve",
                type: "circumstance"
            }]
        },
        {
            _id: "fortuneTeller",
            name: "PF1ECaravans.TravelerRole.FortuneTeller",
            onlyParty: true,
            max: 0
        },
        {
            _id: "guard",
            name: "PF1ECaravans.TravelerRole.Guard",
            monthlyWage: 100,
            _changes: [{
                formula: "1",
                target: "caravan_offense",
                type: "circumstance"
            }],
            _contextNotes: [{
                target: "caravan_security",
                text: "+1 to avoid being surprised"
            }]
        },
        {
            _id: "guide",
            name: "PF1ECaravans.TravelerRole.Guide",
            monthlyWage: 50,
            _changes: [{
                formula: "1",
                target: "caravan_security",
                type: "circumstance"
            }]
        },
        {
            _id: "healer",
            name: "PF1ECaravans.TravelerRole.Healer",
            monthlyWage: 50,
            _contextNotes: [{
                target: "caravan_rest",
                text: "Provides long-term care for up to 6 travelers"
            }]
        },
        {
            _id: "passenger",
            name: "PF1ECaravans.TravelerRole.Passenger.Base",
            tasks: [
                {
                    id: "passenger",
                    name: "PF1ECaravans.TravelerRole.Passenger.Standard",
                },
                {
                    id: "prisoner",
                    name: "PF1ECaravans.TravelerRole.Passenger.Prisoner",
                }
            ]
        },
        {
            _id: "scout",
            name: "PF1ECaravans.TravelerRole.Scout.Base",
            monthlyWage: 100,
            changes: [],
            tasks: [
                {
                    id: "food",
                    name: "PF1ECaravans.TravelerRole.Scout.Food",
                    _changes: [{
                        formula: -3,
                        target: "caravan_consumption",
                        type: "circumstance"
                    }]
                }, {
                    id: "security",
                    name: "PF1ECaravans.TravelerRole.Scout.Security",
                    _changes: [{
                        formula: "1",
                        target: "caravan_security",
                        type: "circumstance"
                    }, {
                        formula: -1,
                        target: "caravan_consumption",
                        type: "untyped"
                    }]
                }
            ]
        },
        {
            _id: "spellCaster",
            name: "PF1ECaravans.TravelerRole.SpellCaster.Base",
            onlyParty: true,
            tasks: [
                {
                    id: "entertainer",
                    name: "PF1ECaravans.TravelerRole.SpellCaster.Entertainer",
                    _changes: [{
                        formula: "1",
                        target: "caravan_resolve",
                        type: "circumstance"
                    }]
                },
                {
                    id: "guard",
                    name: "PF1ECaravans.TravelerRole.SpellCaster.Guard",
                    _changes: [{
                        formula: "1",
                        target: "caravan_offense",
                        type: "circumstance"
                    }],
                    _contextNotes: [{
                        target: "caravan_security",
                        text: "+1 to avoid being surprised"
                    }]
                },
                {
                    id: "guide",
                    name: "PF1ECaravans.TravelerRole.SpellCaster.Guide",
                    _changes: [{
                        formula: "1",
                        target: "caravan_security",
                        type: "circumstance"
                    }]
                },
                {
                    id: "healer",
                    name: "PF1ECaravans.TravelerRole.SpellCaster.Healer",
                    _contextNotes: [{
                        target: "caravan_rest",
                        text: "Provides long-term care for up to 6 travelers"
                    }]
                },
                {
                    id: "scoutFood",
                    name: "PF1ECaravans.TravelerRole.SpellCaster.ScoutFood",
                    _changes: [{
                        formula: -3,
                        target: "caravan_consumption",
                        type: "circumstance"
                    }]
                },
                {
                    id: "scoutSecurity",
                    name: "PF1ECaravans.TravelerRole.SpellCaster.ScoutSecurity",
                    _changes: [{
                        formula: "1",
                        target: "caravan_security",
                        type: "circumstance"
                    }, {
                        formula: -1,
                        target: "caravan_consumption",
                        type: "untyped"
                    }]
                }
            ]
        },
        {
            _id: "trader",
            name: "PF1ECaravans.TravelerRole.Trader",
            monthlyWage: 10
        },
        {
            _id: "wainwright",
            name: "PF1ECaravans.TravelerRole.Wainwright",
            monthlyWage: 10
        },
        {
            _id: "custom",
            name: "PF1ECaravans.TravelerRole.Custom",
        }
    ];
}

export let travelerRoles = new TravelerRoles();