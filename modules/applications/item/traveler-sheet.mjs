import {CaravanItemSheet} from "./_caravanItem.mjs";

export class TravelerSheet extends CaravanItemSheet {
    get template() {
        return `modules/pf1e-caravans/templates/item/traveler.hbs`;
    }
}