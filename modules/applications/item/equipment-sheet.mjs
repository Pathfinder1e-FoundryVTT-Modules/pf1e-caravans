import {CaravanItemSheet} from "./caravan-item-sheet.mjs";

export class EquipmentSheet extends CaravanItemSheet {
    get template() {
        return `modules/pf1e-caravans/templates/item/equipment.hbs`;
    }
}