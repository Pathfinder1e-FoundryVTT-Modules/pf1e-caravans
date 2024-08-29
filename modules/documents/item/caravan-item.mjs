export class CaravanItem extends pf1.documents.item.ItemBasePF {
    get hasChanges() {
        return true;
    }

    static getDefaultArtwork(itemData) {
        const result = super.getDefaultArtwork(itemData);
        const image = pf1.config.defaultIcons.items[itemData?.type];
        if (image) result.img = image;
        return result;
    }

    prepareDerivedData() {
        super.prepareDerivedData();
        this._prepareChanges();

        if (this.system.contextNotes?.length) {
            this.system.contextNotes = this.system.contextNotes.map(
                (cn) => new pf1.components.ContextNote(cn, { parent: this })
            );
        }
    }

    _prepareChanges() {
        const prior = this.changes;
        const collection = new Collection();
        for (const c of this.system.changes ?? []) {
            let change = null;
            if (prior && prior.has(c._id)) {
                change = prior.get(c._id);
                const updateData = {...c};
                change.updateSource(updateData, {recursive: false});
                change.prepareData();
            } else change = new pf1.components.ItemChange(c, {parent: this});
            collection.set(c._id || change.data._id, change);
        }

        this.changes = collection;
    }

    getRollData(options = {refresh: false}) {
        return this.parent.getRollData(options);
    }

    getLabels({ actionId, rollData } = {}) {
        const action = actionId ? this.actions.get(actionId) : this.defaultAction;
        return {
            activation: pf1.config.abilityActivationTypes.passive, // Default passive if no action is present
            ...(action?.getLabels({ rollData }) ?? {}),
        };
    }

    get defaultAction() {
        return this.actions?.get(this.system.actions?.[0]?._id);
    }
}