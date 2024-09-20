import {CaravanItemSheet} from "./caravan-item-sheet.mjs";
import {MODULE_ID} from "../../_moduleId.mjs";

export class TravelerSheet extends CaravanItemSheet {
    get template() {
        return `modules/${MODULE_ID}/templates/item/traveler.hbs`;
    }

    async getData(options = {}) {
        const context = await super.getData(options);

        // const travelerRoles = {};
        // pf1.registry.travelerRoles.map(travelerRole => {
        //     travelerRoles[travelerRole.id] = travelerRole.name;
        // })
        context.travelerRoles = [...pf1.registry.travelerRoles.values()];

        const travelerRole = pf1.registry.travelerRoles.get(this.item.system.subType);

        context.hasTasks = travelerRole?.tasks?.length || false;
        context.tasks = travelerRole.tasks;

        context.isActor = !!this.item.representsActor;
        context.customizable = this.item.system.subType === "custom";
        context.hasWage = !context.isActor && !this.item.system.isNPC;
        return context;
    }
}