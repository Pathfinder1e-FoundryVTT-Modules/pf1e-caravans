export class CaravanItem extends pf1.documents.item.ItemBasePF {
    get hasChanges() {
        return true;
    }

    prepareDerivedData() {
        super.prepareDerivedData();
        this._prepareChanges();
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
}