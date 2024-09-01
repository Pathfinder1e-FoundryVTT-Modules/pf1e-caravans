import {MODULE_ID} from "../../_moduleId.mjs";

export class CaravanConvertTreasure extends DocumentSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        return foundry.utils.mergeObject(options, {
            classes: ["pf1", "actor-rest"],
            template: `modules/${MODULE_ID}/templates/apps/caravan-convert-treasure.hbs`,
            width: 500,
            closeOnSubmit: true,
        });
    }

    async getData(options = {}) {
        const context = super.getData(options);

        const treasure = this.actor.items.filter((item) => !item.type.startsWith(`${MODULE_ID}.`) && item.system.quantity);
        const newGold = pf1.utils.currency.split(treasure.reduce((acc, item) => acc + item.system.price * item.system.quantity, 0) * 100);

        context.description = game.i18n.format("PF1ECaravans.ConvertTreasureDescription", {
            treasureCount: treasure.reduce((acc, item) => acc + item.system.quantity, 0),
            pp: newGold.pp,
            gp: newGold.gp,
            sp: newGold.sp,
            cp: newGold.cp,
        })

        return context;
    }

    /** @type {CaravanActor} */
    get actor() {
        return this.document;
    }

    /* -------------------------------------------- */

    /**
     * Configure the title of the special traits selection window to include the Actor name
     *
     * @type {string}
     */
    get title() {
        return `${game.i18n.localize("PF1ECaravans.ConvertTreasureToGold")}: ${this.actor.name}`;
    }

    /* -------------------------------------------- */

    /**
     * Update the Actor using the configured options
     * Remove/unset any flags which are no longer configured
     *
     * @param event
     * @param formData
     */
    async _updateObject(event, formData) {
        this.actor.convertTreasure(formData);
    }
}
