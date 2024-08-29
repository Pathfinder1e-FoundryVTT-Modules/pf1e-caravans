import {CaravanItemSheet} from "./caravan-item-sheet.mjs";

export class TravelerSheet extends CaravanItemSheet {
    get template() {
        return `modules/pf1e-caravans/templates/item/traveler.hbs`;
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
                tasks[task.id] = game.i18n.localize(task.name);
            })
        }
        context.hasTasks = travelerRole?.tasks?.length || false;
        context.tasks = tasks;

        return context;
    }
}