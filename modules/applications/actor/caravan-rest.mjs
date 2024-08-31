import {MODULE_ID} from "../../_moduleId.mjs";

export class CaravanRestDialog extends DocumentSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        return foundry.utils.mergeObject(options, {
            classes: ["pf1", "actor-rest"],
            template: `modules/${MODULE_ID}/templates/apps/caravan-rest.hbs`,
            width: 500,
            closeOnSubmit: true,
        });
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
        return `${game.i18n.localize("PF1.Rest")}: ${this.actor.name}`;
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
        this.actor.performRest(formData);
    }
}
