import {CaravanItemModel} from "./caravan-item-model.js";

export class FeatModel extends CaravanItemModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {};
    }

    prepareDerivedData() {
    }
}