import {CaravanItemSheet} from "./caravan-item-sheet.mjs";
import {MODULE_ID} from "../../_moduleId.mjs";

export class WagonSheet extends CaravanItemSheet {
    get template() {
        return `modules/${MODULE_ID}/templates/item/wagon.hbs`;
    }

    async getData(options = {}) {
        const context = await super.getData(options);

        const wagonTypes = {};
        pf1.registry.wagonTypes.map(wagonType => {
            wagonTypes[wagonType.id] = wagonType.name;
        })

        context.wagonTypes = wagonTypes;
        return context;
    }
}