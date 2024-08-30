import {getBuffTargets} from "../../util/util.mjs";

export class CaravanItemSheet extends pf1.applications.item.ItemSheetPF {
    static get defaultOptions() {
        const options = super.defaultOptions;

        return {
            ...options,
            classes: [...options.classes, "pf1", "item", "caravanItem"]
        };
    }

    async _updateObject(event, formData) {
        return ItemSheet.prototype._updateObject.call(this, event, formData);
    }

    _onDeleteChange(event) {
        event.preventDefault();
        const el = event.target;
        const changeId = el.dataset.changeId;

        game.tooltip.dismissLockedTooltip(el.closest(".locked-tooltip"));
        this.item.changes.get(changeId)?.delete();
    }

    async getData(options = {}) {
        const lang = game.settings.get("core", "language");

        /** @type {ItemPF} */
        const item = this.item,
            itemData = item.system;

        const actor = item.actor,
            actorData = actor?.system;


        const defaultAction = item.defaultAction;

        const rollData = defaultAction?.getRollData() ?? item.getRollData();

        const context = {
            item,
            document: item, // Reference used by unknown data
            name: item.name,
            system: itemData,
            itemType: game.i18n.localize(CONFIG.Item.typeLabels[item.type]),
            rollData,
            config: pf1.config,
            owned: !!actor,
            owner: item.isOwner,
            editable: this.isEditable,
            customizable: itemData.subType === "custom",
            isGM: game.user.isGM,
            labels: item.getLabels({ rollData }),
            canClassLink: pf1.config.classAssociations.includes(item.type) && !!rollData.classes,
            inContainer: item.inContainer ?? false,
            // Include raw tag data (from source to not get autofilled tag)
            tag: this.item._source.system.tag,
        };

        context.hasSubCategory = ["wagon", "traveler"].includes(item.system.subType);

        context.descriptionHTML = {identified: await TextEditor.enrichHTML(this.object.system.description.value || "", {
            async: true,
            secrets: this.object.isOwner,
            relativeTo: this.object
        })};

        // Prepare stuff for changes
        if (item.changes?.size) {
            const buffTargets = getBuffTargets(actor);
            let showPriority = false;
            context.changes =
                item.changes?.map((/** @type {ItemChange} */ ch) => {
                    const target = buffTargets[ch.target];
                    const typeLabel = pf1.config.bonusTypes[ch.type];
                    const chData = {
                        change: ch,
                        isValid: !!target,
                        label: target?.label ?? ch.target,
                        isDeferred: ch.isDeferred,
                        isAdd: ch.operator === "add",
                        isSet: ch.operator === "set",
                        ...ch,
                        isValidType: !!typeLabel,
                        typeLabel: typeLabel || ch.type,
                        id: ch.id,
                    };
                    chData.priority ||= 0;
                    if (chData.priority != 0) showPriority = true;
                    return chData;
                }) ?? [];

            context.changePriority = showPriority;
        }

        // Prepare stuff for items with context notes
        if (itemData.contextNotes) {
            // TODO: Remove .toObject() and move the supporting data to the datamodel
            context.contextNotes = itemData.contextNotes.map((cn) => cn.toObject());
            const noteTargets = getBuffTargets(actor, "contextNotes");
            context.contextNotes.forEach((n) => {
                const target = noteTargets[n.target];
                n.isValid = !!target;
                n.label = target?.label ?? n.target;
            });
        }
        // Add item flags
        this._prepareItemFlags(context);

        context.distanceUnit = game.i18n.localize(
            pf1.utils.getDistanceSystem() === "imperial" ? "PF1.Distance.ftShort" : "PF1.Distance.mShort"
        );

        return context;
    }
}