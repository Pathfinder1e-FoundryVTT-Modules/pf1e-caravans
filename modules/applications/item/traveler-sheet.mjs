import {CaravanItemSheet} from "./caravan-item-sheet.mjs";
import {MODULE_ID} from "../../_moduleId.mjs";

export class TravelerSheet extends CaravanItemSheet {
    get template() {
        return `modules/${MODULE_ID}/templates/item/traveler.hbs`;
    }

    async getData(options = {}) {
        const context = await super.getData(options);

        const travelerRoles = {};
        pf1.registry.travelerRoles.map(travelerRole => {
            travelerRoles[travelerRole.id] = travelerRole.name;
        })
        context.travelerRoles = travelerRoles;

        const travelerRole = pf1.registry.travelerRoles.get(this.item.system.subType);
        let tasks = {};
        if(travelerRole?.tasks?.length) {
            travelerRole.tasks.map(task => {
                tasks[task.id] = task.name;
            })
        }
        context.hasTasks = travelerRole?.tasks?.length || false;
        context.tasks = tasks;

        context.isActor = !!this.item.representsActor;

        return context;
    }
}