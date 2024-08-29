import {CaravanItem} from "./caravan-item.mjs";

export class WagonItem extends CaravanItem {
    getLabels({ actionId, rollData } = {}) {
        const labels = super.getLabels({ actionId, rollData });

        labels.wagonType = pf1.registry.wagonTypes.get(this.system.subType)?.name ?? "";

        return labels;
    }
}