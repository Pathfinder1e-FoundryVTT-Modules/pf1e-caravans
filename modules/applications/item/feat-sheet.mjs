import {CaravanItemSheet} from "./caravan-item-sheet.mjs";

export class FeatSheet extends CaravanItemSheet {
    get template() {
        return `modules/pf1e-caravans/templates/item/feat.hbs`;
    }
}