import {CaravanItemModel} from "./caravan-item-model.js";

export class EquipmentModel extends CaravanItemModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {};
    }

    prepareDerivedData() {
    }
}