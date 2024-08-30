import {CaravanItemSheet} from "./caravan-item-sheet.mjs";
import {MODULE_ID} from "../../_moduleId.mjs";

export class FeatSheet extends CaravanItemSheet {
    get template() {
        return `modules/${MODULE_ID}/templates/item/feat.hbs`;
    }
}