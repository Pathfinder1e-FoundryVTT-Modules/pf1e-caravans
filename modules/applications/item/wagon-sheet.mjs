import {CaravanItemSheet} from "./_caravanItem.mjs";

export class WagonSheet extends CaravanItemSheet {
    get template() {
        return `modules/pf1e-caravans/templates/item/wagon.hbs`;
    }
}