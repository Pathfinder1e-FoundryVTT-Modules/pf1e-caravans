import {buffTargets} from "../../config/buffTargets.mjs";
import {MODULE_ID} from "../../pf1e-caravans.mjs";
import {enrichHTMLUnrolled} from "../../../../../systems/pathfinder-1e/module/utils/lib.mjs";

export class CaravanActor extends pf1.documents.actor.ActorBasePF {
    constructor(...args) {
        super(...args);

        if (this.itemFlags === undefined)
            /**
             * Init item flags.
             */
            this.itemFlags = {boolean: {}, dictionary: {}};

        if (this.changeItems === undefined)
            /**
             * A list of all the active items with changes.
             *
             * @type {ItemPF[]}
             */
            this.changeItems = [];

        if (this.changes === undefined)
            /**
             * Stores all ItemChanges from carried items.
             *
             * @public
             * @type {Collection<ItemChange>}
             */
            this.changes = new Collection();

        if (this._rollData === undefined)
            /**
             * Cached roll data for this item.
             *
             * @internal
             * @type {object}
             */
            this._rollData = null;
    }

    static getDefaultArtwork(actorData) {
        return pf1.documents.actor.ActorPF.getDefaultArtwork.call(this, actorData);
    }

    prepareBaseData() {
        this._initialized = false;
        super.prepareBaseData();

        if (Hooks.events.pf1PrepareBaseActorData?.length) {
            Hooks.callAll("pf1PrepareBaseActorData", this);
        }

        /** @type {Record<string, SourceInfo>} */
        this.sourceInfo = {};
        this.changeFlags = {};
    }

    _prepareChanges() {
        const changes = [];

        this._addDefaultChanges(changes);

        this.changeItems = this.items.filter((item) => item.hasChanges && item.isActive);
        for (const i of this.changeItems) {
            changes.push(...i.changes, ...(i._changes ?? []));
        }

        const c = new Collection();
        for (const change of changes) {
            // Avoid ID conflicts
            const parentId = change.parent?.id ?? "Actor";
            const uniqueId = `${parentId}-${change._id}`;
            c.set(uniqueId, change);
        }
        this.changes = c;
    }

    _addDefaultChanges(changes) {
        const system = this.system;

        const wagons = this.itemTypes[`${MODULE_ID}.wagon`];
        const travelers = this.itemTypes[`${MODULE_ID}.traveler`];
        const heroesCount = Math.min(4, travelers.filter(traveler => traveler.system.details.isHero).length);

        for (const [derivedAttributeId, baseAttributeId] of [
            ["attack", "offense"],
            ["armorClass", "defense"],
            ["security", "mobility"],
            ["resolve", "morale"]
        ]) {
            changes.push(new pf1.components.ItemChange({
                formula: `@statistics.${baseAttributeId}.total`,
                target: `caravan_${derivedAttributeId}`,
                type: "untyped",
                operator: "add",
                priority: 1000,
                flavor: game.i18n.localize(`PF1ECaravans.Statistics.${baseAttributeId.capitalize()}`)
            }));
        }

        changes.push(new pf1.components.ItemChange({
            formula: `@statistics.morale.total`,
            target: "caravan_unrest",
            type: "untyped",
            operator: "add",
            priority: 0,
            flavor: game.i18n.localize("PF1ECaravans.Statistics.Morale")
        }));

        for (const derivedAttributeId of ["attack", "security", "resolve"]) {
            changes.push(new pf1.components.ItemChange({
                formula: `${heroesCount}`,
                target: `caravan_${derivedAttributeId}`,
                type: "untyped",
                operator: "add",
                priority: 0,
                flavor: game.i18n.localize(`PF1ECaravans.Heroes`)
            }));
        }

        changes.push(new pf1.components.ItemChange({
            formula: `${travelers.length}`,
            target: "caravan_consumption",
            type: "untyped",
            operator: "add",
            priority: 10,
            flavor: game.i18n.localize(`PF1ECaravans.Travelers`)
        }));

        changes.push(
            new pf1.components.ItemChange({
                formula: "" + wagons.reduce((acc, wagon) => acc + wagon.system.consumption, 0),
                target: "caravan_consumption",
                type: "untyped",
                operator: "add",
                priority: 0,
                flavor: game.i18n.localize(`PF1ECaravans.Wagons`)
            }),
            new pf1.components.ItemChange({
                formula: "" + wagons.reduce((acc, wagon) => acc + wagon.system.hp, 0),
                target: "caravan_hp",
                type: "untyped",
                operator: "add",
                priority: 0,
                flavor: game.i18n.localize(`PF1ECaravans.Wagons`)
            }),
            new pf1.components.ItemChange({
                formula: "" + wagons.reduce((acc, wagon) =>  acc + wagon.system.capacity.traveler, 0),
                target: "caravan_travelers",
                type: "untyped",
                operator: "add",
                priority: 0,
                flavor: game.i18n.localize(`PF1ECaravans.Wagons`)
            }),
            new pf1.components.ItemChange({
                formula: "" + wagons.reduce((acc, wagon) =>  acc + wagon.system.capacity.cargo, 0),
                target: "caravan_cargo",
                type: "untyped",
                operator: "add",
                priority: 0,
                flavor: game.i18n.localize(`PF1ECaravans.Wagons`)
            })
        );

        const hasFortuneTeller = travelers.filter(traveler => traveler.system.subType === "fortuneTeller").length > 0;
        if (!hasFortuneTeller) {
            for (const attribute of ["attack", "security", "resolve"]) {
                changes.push(new pf1.components.ItemChange({
                    formula: "-2",
                    target: `caravan_${attribute}`,
                    type: "untyped",
                    operator: "add",
                    priority: 2,
                    flavor: game.i18n.localize("PF1ECaravans.NoFortuneTeller")
                }));
            }
        }

        switch (system.details.condition) {
            case "fatigued":
                for (const statistic of ["attack", "security", "resolve"]) {
                    changes.push(new pf1.components.ItemChange({
                        formula: "-2",
                        target: `caravan_${statistic}`,
                        type: "untyped",
                        operator: "add",
                        priority: 1001,
                        flavor: game.i18n.localize("PF1ECaravans.Conditions.Fatigued")
                    }))
                }
                changes.push(new pf1.components.ItemChange({
                    formula: "-(@details.speed.total / 2)",
                    target: `caravan_speed`,
                    type: "untyped",
                    operator: "add",
                    priority: 1001,
                    flavor: game.i18n.localize("PF1ECaravans.Conditions.Fatigued")
                }))
                break;

            case "exhausted":
                for (const statistic of ["attack", "security", "resolve"]) {
                    changes.push(new pf1.components.ItemChange({
                        formula: "-6",
                        target: `caravan_${statistic}`,
                        type: "untyped",
                        operator: "add",
                        priority: 1001,
                        flavor: game.i18n.localize("PF1ECaravans.Conditions.Exhausted")
                    }))
                }
                changes.push(new pf1.components.ItemChange({
                    formula: "0",
                    target: `caravan_speed`,
                    type: "untyped",
                    operator: "set",
                    priority: 1001,
                    flavor: game.i18n.localize("PF1ECaravans.Conditions.Exhausted")
                }))
                break;
        }

        changes.push(new pf1.components.ItemChange({
            formula: travelers.reduce((acc, traveler) => acc + traveler.system.monthlyWage || 0, 0),
            target: "caravan_wages",
            type: "untyped",
            operator: "add",
            priority: 10,
            flavor: game.i18n.localize(`PF1ECaravans.Travelers`)
        }));

        changes.push(new pf1.components.ItemChange({
            formula: this.system.details.level,
            target: "caravan_feats",
            type: "untyped",
            operator: "add",
            priority: 10,
            flavor: game.i18n.localize(`PF1ECaravans.Levels`)
        }));
    }

    applyActiveEffects() {
        // Apply active effects. Required for status effects in v11 and onward, such as blind and invisible.
        super.applyActiveEffects();
        this._prepareChanges();
    }

    prepareDerivedData() {
        super.prepareDerivedData();

        delete this._rollData;
        pf1.documents.actor.changes.applyChanges.call(this);

        this._initialized = true;
        this._setSourceDetails();
    }

    get _skillTargets() {
        return [];
    }

    refreshDerivedData() {
    }

    /**
     * Retrieve data used to fill in roll variables.
     *
     * @example
     * await new Roll("1d20 + \@abilities.wis.mod[Wis]", actor.getRollData()).toMessage();
     *
     * @override
     * @param {object} [options] - Additional options
     * @returns {object}
     */
    getRollData(options = {refresh: false}) {
        // Return cached data, if applicable
        const skipRefresh = !options.refresh && this._rollData;

        const result = {...(skipRefresh ? this._rollData : foundry.utils.deepClone(this.system))};

        // Clear certain fields if not refreshing
        if (skipRefresh) {
            for (const path of pf1.config.temporaryRollDataFields.actor) {
                foundry.utils.setProperty(result, path, undefined);
            }
        }

        /* ----------------------------- */
        /* Always add the following data
        /* ----------------------------- */

        // Add combat round, if in combat
        if (game.combats?.viewed) {
            result.combat = {
                round: game.combat.round || 0,
            };
        }

        // Return cached data, if applicable
        if (skipRefresh) return result;

        /* ----------------------------- */
        /* Set the following data on a refresh
        /* ----------------------------- */

        // Add item dictionary flags
        result.dFlags = this.itemFlags?.dictionary ?? {};
        result.bFlags = Object.fromEntries(
            Object.entries(this.itemFlags?.boolean ?? {}).map(([key, {sources}]) => [key, sources.length > 0 ? 1 : 0])
        );

        this._rollData = result;

        // Call hook
        if (Hooks.events["pf1GetRollData"]?.length > 0) Hooks.callAll("pf1GetRollData", this, result);

        return result;
    }

    _setSourceDetails() {
        const sourceDetails = {};
        // Get empty source arrays
        for (const b of Object.keys(buffTargets)) {
            const buffTargets = pf1.documents.actor.changes.getChangeFlat.call(this, b, null);
            for (const bt of buffTargets) {
                if (!sourceDetails[bt]) sourceDetails[bt] = [];
            }
        }

        const wagons = this.itemTypes[`${MODULE_ID}.wagon`];
        sourceDetails["system.statistics.armorClass"].push({
            name: game.i18n.localize("PF1.Base"),
            value: game.i18n.format("PF1.SetTo", {value: 10})
        });
        sourceDetails["system.wagons.max"].push({
            name: game.i18n.localize("PF1.Base"),
            value: game.i18n.format("PF1.SetTo", {value: 5})
        });
        for (let attributeId of ["offense", "defense", "mobility", "morale"]) {
            sourceDetails[`system.statistics.${attributeId}.total`].push({
                name: game.i18n.localize("PF1.Base"),
                value: this.system.statistics[attributeId].base
            });
        }
        sourceDetails["system.details.speed.total"].push({
            name: game.i18n.localize("PF1.Base"),
            value: game.i18n.format("PF1.SetTo", { value: 32 })
        });

        // Add extra data
        const rollData = this.getRollData();
        for (const [path, changeGrp] of Object.entries(this.sourceInfo)) {
            /** @type {Array<SourceInfo[]>} */
            const sourceGroups = Object.values(changeGrp);
            for (const grp of sourceGroups) {
                sourceDetails[path] ||= [];
                for (const src of grp) {
                    src.operator ||= "add";
                    // TODO: Separate source name from item type label
                    const label = this.constructor._getSourceLabel(src);
                    let srcValue =
                        src.value != null
                            ? src.value
                            : RollPF.safeRollAsync(src.formula || "0", rollData, [path, src, this], {
                                suppressError: !this.isOwner,
                            }).total;
                    if (src.operator === "set") {
                        let displayValue = srcValue;
                        if (src.change?.isDistance) displayValue = pf1.utils.convertDistance(displayValue)[0];
                        srcValue = game.i18n.format("PF1.SetTo", {value: displayValue});
                    }

                    // Add sources only if they actually add something else than zero
                    if (!(src.operator === "add" && srcValue === 0) || src.ignoreNull === false) {
                        sourceDetails[path].push({
                            name: label.replace(/[[\]]/g, ""),
                            modifier: src.modifier || "",
                            value: srcValue,
                        });
                    }
                }
            }
        }

        this.sourceDetails = sourceDetails;
    }

    /**
     * @internal
     * @param {SourceInfo} src - Source info
     */
    static _getSourceLabel(src) {
        // TODO: Anything needed here?
        return src.name;
    }

    async rollAttributeTest(attribute, options = {}) {
        if (!this.isOwner) {
            return void ui.notifications.warn(game.i18n.format("PF1.Error.NoActorPermissionAlt", { name: this.name }));
        }

        const allowedAttributes = ["resolve", "security"];
        if(!allowedAttributes.includes(attribute)) {
            return void ui.notifications.warn(game.i18n.format("PF1ECaravans.Error.InvalidAttribute", { attribute }));
        }

        // Add contextual notes
        const rollData = options.rollData || this.getRollData();
        const noteObjects = this.getContextNotes(`caravan_${attribute}`);
        const notes = this.formatContextNotes(noteObjects, rollData);

        const label = game.i18n.localize(`PF1ECaravans.Statistics.${attribute.capitalize()}`);
        const parts = [`@statistics.${attribute}[${label}]`];

        const props = [];
        if (notes.length > 0) props.push({ header: game.i18n.localize("PF1.Notes"), value: notes });

        const token = options.token ?? this.token;

        const rollOptions = {
            ...options,
            parts,
            rollData,
            flavor: game.i18n.format(`PF1ECaravans.${attribute.capitalize()}Test`),
            chatTemplateData: { properties: props },
            speaker: ChatMessage.implementation.getSpeaker({ actor: this, token, alias: token?.name }),
        };

        return await pf1.dice.d20Roll(rollOptions);
    }

    formatContextNotes(notes, rollData, { roll = true } = {}) {
        const result = [];
        rollData ??= this.getRollData();
        for (const noteObj of notes) {
            rollData.item = {};
            if (noteObj.item != null) rollData = noteObj.item.getRollData();

            for (const note of noteObj.notes) {
                result.push(
                    ...note
                        .split(/[\n\r]+/)
                        .map((subNote) => enrichHTMLUnrolled(subNote, { rollData, rolls: roll, relativeTo: this }))
                );
            }
        }
        return result;
    }

    get allNotes() {
        return this.items
            .filter((item) => item.isActive && (item.system.contextNotes?.length > 0 || item.system._contextNotes?.length > 0))
            .map((item) => {
                const notes = [];
                notes.push(...(item.system.contextNotes ?? []));
                notes.push(...(item.system._contextNotes ?? []));
                return { notes, item };
            });
    }

    getContextNotes(context, all = true) {
        if (context.string) context = context.string;
        const result = this.allNotes;

        const notes = result.filter((n) => n.target == context);
        for (const note of result) {
            note.notes = note.notes.filter((o) => o.target === context).map((o) => o.text);
        }

        return result.filter((n) => n.notes.length);
    }
}