import {CaravanItemModel} from "./caravan-item-model.mjs";

export class WagonModel extends CaravanItemModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = {
            subType: new fields.StringField({required: true, initial: "coveredWagon"}),
            cost: new fields.NumberField({required: false, initial: undefined}),
            hp: new fields.NumberField({required: false, initial: undefined}),
            capacity: new fields.SchemaField({
                traveler: new fields.NumberField({required: false, initial: undefined}),
                cargo: new fields.NumberField({required: false, initial: undefined})
            }),
            max: new fields.NumberField({required: false, initial: undefined}),
            consumption: new fields.NumberField({required: false, initial: undefined}),
        };
        this.addDefaultSchemaFields(schema);
        return schema;
    }

    prepareDerivedData() {
        super.prepareDerivedData();

        this._mergeWagonDetails();
    }

    _mergeWagonDetails() {
        if(this.wagonDetailsMerged) {
            return;
        }
        this.wagonDetailsMerged = true;

        const wagonDetails = pf1.registry.wagonTypes.get(this.subType) ?? {
            capacity: {
                passengers: 0,
                cargo: 0
            }
        };
        this._recurseAttach(this, wagonDetails);
    }
}