import {CaravanItemModel} from "./caravan-item-model.js";

export class EquipmentModel extends CaravanItemModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.SchemaField({
                value: new fields.StringField({required: true, initial: ""}),
            }),
            quantity: new fields.NumberField({required: true, initial: 1}),
            units: new fields.SchemaField({
                value: new fields.NumberField({required: true, initial: 1})
            }),
            price: new fields.NumberField({required: true, initial: 0}),
            changes: new fields.ArrayField(new fields.SchemaField({
                _id: new fields.StringField({required: true, initial: ""}),
                formula: new fields.StringField({initial: ""}),
                target: new fields.StringField({initial: ""}),
                type: new fields.StringField({initial: ""}),
                operator: new fields.StringField({required: false, initial: undefined}),
                priority: new fields.NumberField({required: false, initial: undefined}),
                continuous: new fields.BooleanField({required: false, initial: undefined}),
            })),
            contextNotes: new fields.ArrayField(new fields.SchemaField({
                target: new fields.StringField({initial: ""}),
                text: new fields.StringField({initial: ""})
            })),
        };
    }

    prepareDerivedData() {
        super.prepareDerivedData();

        this.units.total = this.quantity * this.units.value;
    }
}