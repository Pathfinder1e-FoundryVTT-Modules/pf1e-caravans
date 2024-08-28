export class CaravanItemSheet extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        return {
            ...options,
            classes: [...options.classes, "pf1", "item", "caravanItem"]
        };
    }

    async getData(options = {}) {
        const context = await super.getData(options);

        context.descriptionHTML = await TextEditor.enrichHTML(this.object.system.details.description.value || "", {
            async: true,
            secrets: this.object.isOwner,
            relativeTo: this.object
        });

        return context;
    }
}