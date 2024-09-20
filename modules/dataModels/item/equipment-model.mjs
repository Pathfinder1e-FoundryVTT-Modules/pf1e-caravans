import {CaravanItemModel} from "./caravan-item-model.mjs";

export class EquipmentModel extends CaravanItemModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = {
            quantity: new fields.NumberField({required: true, initial: 1}),
            units: new fields.SchemaField({
                value: new fields.NumberField({required: true, initial: 1})
            }),
            price: new fields.NumberField({required: true, initial: 0}),
        };
        this.addDefaultSchemaFields(schema);
        return schema;
    }

    prepareDerivedData() {
        super.prepareDerivedData();

        this.units.total = this.quantity * this.units.value;
    }
}