import {CaravanItemSheet} from "./caravan-item-sheet.mjs";
import {MODULE_ID} from "../../_moduleId.mjs";

export class EquipmentSheet extends CaravanItemSheet {
    get template() {
        return `modules/${MODULE_ID}/templates/item/equipment.hbs`;
    }
}