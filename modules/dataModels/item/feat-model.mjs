import {CaravanItemModel} from "./caravan-item-model.mjs";

export class FeatModel extends CaravanItemModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = {
            subType: new fields.StringField({required: true, initial: "feat"}),
        };
        this.addDefaultSchemaFields(schema);
        return schema;
    }
}