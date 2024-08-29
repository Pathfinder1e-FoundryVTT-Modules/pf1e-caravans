import {CaravanItemSheet} from "./caravan-item-sheet.mjs";

export class WagonSheet extends CaravanItemSheet {
    get template() {
        return `modules/pf1e-caravans/templates/item/wagon.hbs`;
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