import {keepUpdateArray} from "../../util/util.mjs";

export class CaravanItem extends pf1.documents.item.ItemPF {
    static get hasChanges() {
        return this.system.hasChanges;
    }

    static system = Object.freeze({
        hasChanges: true,
        links: []
    });

    get hasChanges() {
        return this.constructor.hasChanges;
    }

    static getDefaultArtwork(itemData) {
        const result = super.getDefaultArtwork(itemData);
        const image = pf1.config.defaultIcons.items[itemData?.type];
        if (image) result.img = image;
        return result;
    }

    async _preCreate(data, context, user) {
        await super._preCreate(data, context, user);

        // Ensure unique Change IDs
        const actor = this.actor;
        if (actor && data?.system?.changes?.length > 0) {
            const changes = data.system.changes;

            let ids = new Set();
            while (ids.size < changes.length) ids.add(foundry.utils.randomID(8));
            ids = Array.from(ids);
            for (const c of changes) c._id = ids.pop();
            this.updateSource({"system.changes": changes});
        }

        const updates = this.preCreateData(data, context, user);

        if (Object.keys(updates).length) this.updateSource(updates);
    }

    preCreateData(data, options, user) {
        return {};
    }

    prepareDerivedData() {
        super.prepareDerivedData();
        this.flags ??= {};

        if (this.system._contextNotes?.length) {
            this.system._contextNotes = this.system._contextNotes.map(
                (cn) => new pf1.components.ContextNote(cn, {parent: this})
            );
        }
    }

    async _preUpdate(changed, context, user) {
        await super._preUpdate(changed, context, user);

        // No system data changes
        if (!changed.system) return;

        const keepPaths = [
            "system.contextNotes",
            "system.changes",
        ];

        const itemData = this.toObject();
        for (const path of keepPaths) {
            keepUpdateArray(itemData, changed, path);
        }
    }

    _prepareChanges() {
        super._prepareChanges();

        const _prior = this._changes;
        const _collection = new Collection();
        for (const c of this.system._changes ?? []) {
            let change = null;
            if (_prior && _prior.has(c._id)) {
                change = _prior.get(c._id);
                const updateData = {...c};
                change.updateSource(updateData, {recursive: false});
                change.prepareData();
            } else change = new pf1.components.ItemChange(c, {parent: this});
            _collection.set(c._id || change.data._id, change);
        }
        this._changes = _collection;
    }

    getLabels({actionId, rollData} = {}) {
        return {};
    }

    get defaultAction() {
        return this.actions?.get(this.system.actions?.[0]?._id);
    }
}