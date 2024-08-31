import {CaravanItemSheet} from "./caravan-item-sheet.mjs";
import {MODULE_ID} from "../../_moduleId.mjs";

export class FeatSheet extends CaravanItemSheet {
    get template() {
        return `modules/${MODULE_ID}/templates/item/feat.hbs`;
    }

    async getData(options = {}) {
        const context = await super.getData(options);

        context.featTypes = {
            feat: "PF1.Subtypes.Item.pf1e-caravans.feat.feat.Single",
            feature: "PF1.Subtypes.Item.pf1e-caravans.feat.feature.Single",
        }

        return context;
    }
}