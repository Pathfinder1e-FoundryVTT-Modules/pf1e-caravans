import {CaravanItemSheet} from "./caravan-item-sheet.mjs";
import {MODULE_ID} from "../../_moduleId.mjs";

export class WagonSheet extends CaravanItemSheet {
    get template() {
        return `modules/${MODULE_ID}/templates/item/wagon.hbs`;
    }

    async getData(options = {}) {
        const context = await super.getData(options);
        context.wagonTypes = [...pf1.registry.wagonTypes.values()];
        context.customizable = this.item.system.subType === "custom";
        return context;
    }
}