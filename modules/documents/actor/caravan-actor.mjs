import {buffTargets} from "../../config/buffTargets.mjs";
import {MODULE_ID} from "../../_moduleId.mjs";
import {sendRestChatMessage} from "../../util/caravanRestMessage.mjs";

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

        this.changeItems = this.items.filter((item) =>
            item.type.startsWith(`${MODULE_ID}.`)
            && item.hasChanges
            && item.isActive
        );
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
        const heroesCount = Math.min(4, travelers.filter(traveler => traveler.system.isHero).length);

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
            priority: 1000,
            flavor: game.i18n.localize("PF1ECaravans.Statistics.Morale")
        }));

        for (const derivedAttributeId of ["attack", "security", "resolve"]) {
            changes.push(new pf1.components.ItemChange({
                formula: `${heroesCount}`,
                target: `caravan_${derivedAttributeId}`,
                type: "untyped",
                operator: "add",
                priority: 1000,
                flavor: game.i18n.localize(`PF1ECaravans.Heroes`)
            }));
        }

        changes.push(new pf1.components.ItemChange({
            formula: `${travelers.length}`,
            target: "caravan_consumption",
            type: "untyped",
            operator: "add",
            priority: 1000,
            flavor: game.i18n.localize(`PF1ECaravans.Travelers`)
        }));

        changes.push(
            new pf1.components.ItemChange({
                formula: "" + wagons.reduce((acc, wagon) => acc + wagon.system.consumption, 0),
                target: "caravan_consumption",
                type: "untyped",
                operator: "add",
                priority: 1000,
                flavor: game.i18n.localize(`PF1ECaravans.Wagons`)
            }),
            new pf1.components.ItemChange({
                formula: "" + wagons.reduce((acc, wagon) => acc + wagon.system.hp, 0),
                target: "caravan_hp",
                type: "untyped",
                operator: "add",
                priority: 1000,
                flavor: game.i18n.localize(`PF1ECaravans.Wagons`)
            }),
            new pf1.components.ItemChange({
                formula: "" + wagons.reduce((acc, wagon) => acc + wagon.system.capacity.traveler, 0),
                target: "caravan_travelers",
                type: "untyped",
                operator: "add",
                priority: 1000,
                flavor: game.i18n.localize(`PF1ECaravans.Wagons`)
            }),
            new pf1.components.ItemChange({
                formula: "" + wagons.reduce((acc, wagon) => acc + wagon.system.capacity.cargo, 0),
                target: "caravan_cargo",
                type: "untyped",
                operator: "add",
                priority: 1000,
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
                    priority: 1000,
                    flavor: game.i18n.localize("PF1ECaravans.NoFortuneTeller")
                }));
            }
        }

        for (const attribute of ["attack", "armorClass", "security", "resolve"]) {
            changes.push(new pf1.components.ItemChange({
                formula: `-max(0, @attributes.unrest.value - @attributes.unrest.limit)[${game.i18n.localize("PF1ECaravans.Mutiny")}]`,
                target: `caravan_${attribute}`,
                type: "untyped",
                operator: "add",
                priority: -1,
                flavor: game.i18n.localize("PF1ECaravans.Mutiny")
            }));
        }

        switch (system.details.condition) {
            case "fatigued":
                for (const statistic of ["attack", "security", "resolve"]) {
                    changes.push(new pf1.components.ItemChange({
                        formula: "-2",
                        target: `caravan_${statistic}`,
                        type: "untyped",
                        operator: "add",
                        priority: 1000,
                        flavor: game.i18n.localize("PF1ECaravans.Conditions.Fatigued")
                    }))
                }
                changes.push(new pf1.components.ItemChange({
                    formula: "-(@details.speed.total / 2)",
                    target: `caravan_speed`,
                    type: "untyped",
                    operator: "add",
                    priority: -1,
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
                        priority: 1000,
                        flavor: game.i18n.localize("PF1ECaravans.Conditions.Exhausted")
                    }))
                }
                changes.push(new pf1.components.ItemChange({
                    formula: "0",
                    target: `caravan_speed`,
                    type: "untyped",
                    operator: "set",
                    priority: -1,
                    flavor: game.i18n.localize("PF1ECaravans.Conditions.Immobilized")
                }))
                break;
        }

        if (system.attributes.hp.value <= 0) {
            changes.push(new pf1.components.ItemChange({
                formula: "0",
                target: `caravan_speed`,
                type: "untyped",
                operator: "set",
                priority: -1,
                flavor: game.i18n.localize("PF1ECaravans.Conditions.Immobilized")
            }))
        }

        changes.push(new pf1.components.ItemChange({
            formula: travelers.reduce((acc, traveler) => acc + traveler.system.monthlyWage || 0, 0),
            target: "caravan_wages",
            type: "untyped",
            operator: "add",
            priority: 1000,
            flavor: game.i18n.localize(`PF1ECaravans.Travelers`)
        }));

        changes.push(new pf1.components.ItemChange({
            formula: this.system.details.level,
            target: "caravan_feats",
            type: "untyped",
            operator: "add",
            priority: 1000,
            flavor: game.i18n.localize(`PF1.Level`)
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
        pf1.documents.actor.changes.applyChanges(this);

        this._initialized = true;

        this.attackItem = {
            id: "caravanAttack",
            actor: this,
            name: this.name,
            img: this.img,
            system: {},
            flags: {},
            getChatData() {
                return {
                    properties: []
                }
            },
            toObject() {
                return this
            },
            executeScriptCalls() {
                return {
                    hideChat: false
                }
            },
            getFlag() {
                return null
            },
            getRollData(options) {
                const rollData = this.actor.getRollData(options)
                rollData.item = this;
                return rollData;
            },
            getContextChanges() {
                return []
            },
        };

        const damageChanges = pf1.documents.actor.changes.getHighestChanges(
            this.changes.filter((c) => c.target === "caravan_damage" && c.operator !== "set"),
            {ignoreTarget: true}
        ).map((c) => ({
            formula: `${c.formula}[${c.flavor}]`,
            type: {
                values: [],
                custom: game.i18n.format("PF1ECaravans.ExtraDamage", {source: c.flavor})
            }
        }))
        this.attackAction = new pf1.components.ItemAction({
            _id: "caravanAttack",
            name: game.i18n.localize("PF1ECaravans.Attack"),
            actionType: "mwak",
            attackBonus: `${this.system.statistics.attack}[${game.i18n.localize("PF1ECaravans.Attack")}]`,
            damage: {
                parts: [
                    {
                        formula: "1d6",
                        type: {
                            values: [],
                            custom: game.i18n.localize("PF1ECaravans.Damage")
                        }
                    }
                ],
                nonCritParts: damageChanges
            },
        }, {
            item: this.attackItem
        });
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

    /**
     * @internal
     * @param {SourceInfo} src - Source info
     */
    static _getSourceLabel(src) {
        // TODO: Anything needed here?
        return src.name;
    }

    getSourceDetails(path) {
        const sources = [];

        const dexDenied = this.changeFlags.loseDexToAC === true;

        // Add extra data
        const rollData = this.getRollData();
        const changeGrp = this.sourceInfo[path] ?? {};
        const sourceGroups = Object.values(changeGrp);

        const typeBonuses = {};

        for (const grp of sourceGroups) {
            for (const src of grp) {
                src.operator ||= "add";
                let srcValue =
                    src.value != null
                        ? src.value
                        : RollPF.safeRollSync(src.formula || "0", rollData, [path, src, this], {
                            suppressError: !this.isOwner,
                        }).total;
                if (src.operator === "set") {
                    let displayValue = srcValue;
                    if (src.change?.isDistance) displayValue = pf1.utils.convertDistance(displayValue)[0];
                    srcValue = game.i18n.format("PF1.SetTo", { value: displayValue });
                }

                // Add sources only if they actually add something else than zero
                if (!(src.operator === "add" && srcValue === 0) || src.ignoreNull === false) {
                    // TODO: Separate source name from item type label
                    const label = this.constructor._getSourceLabel(src);
                    const info = { name: label.replace(/[[\]]/g, ""), value: srcValue, modifier: src.modifier || null };
                    typeBonuses[src.modifier || "untyped"] ??= [];
                    typeBonuses[src.modifier || "untyped"].push(info);
                    sources.push(info);
                }
            }
        }

        // Sort and disable entries
        const stacking = new Set(pf1.config.stackingBonusTypes);
        for (const [type, entries] of Object.entries(typeBonuses)) {
            if (stacking.has(type)) continue;
            entries.sort((a, b) => b.value - a.value);
            for (const entry of entries) {
                entry.disabled = entry.value >= 0 || typeof entry.value !== "number";
            }
            entries[0].disabled = false;
        }

        const wagons = this.itemTypes[`${MODULE_ID}.wagon`];
        if(path === "system.statistics.armorClass") {
            sources.push({
                name: game.i18n.localize("PF1.Base"),
                value: game.i18n.format("PF1.SetTo", {value: 10})
            });
        }

        if(path === "system.wagons.max") {
            sources.push({
                name: game.i18n.localize("PF1.Base"),
                value: game.i18n.format("PF1.SetTo", {value: 5})
            });
        }

        for (let attributeId of ["offense", "defense", "mobility", "morale"]) {
            if(path === `system.statistics.${attributeId}.total`) {
                sources.push({
                    name: game.i18n.localize("PF1.Base"),
                    value: this.system.statistics[attributeId].base
                });
            }
        }

        if(path === "system.details.speed.total") {
            sources.push({
                name: game.i18n.localize("PF1.Base"),
                value: game.i18n.format("PF1.SetTo", {value: 32})
            });
        }

        return sources;
    }

    async rollAttack(
        {
            ev = null,
            skipDialog = pf1.documents.settings.getSkipActionPrompt(),
            rollMode,
            chatMessage = true,
            dice = pf1.dice.D20RollPF.standardRoll,
            token,
            options = {}
        } = {}
    ) {
        if (!this.isOwner) {
            return void ui.notifications.warn(game.i18n.format("PF1.Error.NoActorPermissionAlt", {name: this.name}));
        }

        rollMode ||= game.settings.get("core", "rollMode");
        token ||= this.token ?? this.getActiveTokens({document: true, linked: true})[0];

        if (ev?.originalEvent) ev = ev.originalEvent;


        // Prepare variables
        /** @type {SharedActionData} */
        const shared = {
            event: ev,
            action: this.attackAction,
            item: this.attackItem,
            token: null,
            rollData: {
                item: this.attackItem
            },
            skipDialog,
            chatMessage,
            dice,
            cost: null,
            fullAttack: false,
            useOptions: options,
            attackBonus: [],
            damageBonus: [],
            attacks: [],
            chatAttacks: [],
            rollMode,
            useMeasureTemplate: false,
            conditionals: null,
            conditionalPartsCommon: {},
            casterLevelCheck: false, // TODO: Move to use-options
            concentrationCheck: false, // TODO: Move to use-options
            scriptData: {},
        };

        // Prevent reassigning the ActionUse's item and token
        Object.defineProperties(shared, {
            item: {value: this.attackItem, writable: false, enumerable: true},
            action: {value: this.attackAction, writable: false, enumerable: true},
            token: {value: token, writable: false, enumerable: true},
        });

        return new pf1.actionUse.ActionUse(shared).process({skipDialog});
    }

    async rollAttributeTest(attribute, options = {}) {
        if (!this.isOwner) {
            return void ui.notifications.warn(game.i18n.format("PF1.Error.NoActorPermissionAlt", {name: this.name}));
        }

        const allowedAttributes = ["resolve", "security"];
        if (!allowedAttributes.includes(attribute)) {
            return void ui.notifications.warn(game.i18n.format("PF1ECaravans.Error.InvalidAttribute", {attribute}));
        }

        // Add contextual notes
        const rollData = options.rollData || this.getRollData();
        const noteObjects = this.getContextNotes(`caravan_${attribute}`);
        const notes = this.formatContextNotes(noteObjects, rollData);

        const label = game.i18n.localize(`PF1ECaravans.Statistics.${attribute.capitalize()}`);
        const parts = [`@statistics.${attribute}[${label}]`];

        const props = [];
        if (notes.length > 0) props.push({header: game.i18n.localize("PF1.Notes"), value: notes});

        const token = options.token ?? this.token;

        const rollOptions = {
            ...options,
            parts,
            rollData,
            flavor: game.i18n.format(`PF1ECaravans.${attribute.capitalize()}Test`),
            chatTemplateData: {properties: props},
            speaker: ChatMessage.implementation.getSpeaker({actor: this, token, alias: token?.name}),
        };

        return await pf1.dice.d20Roll(rollOptions);
    }

    getFeatCount() {
        const ownedItems = this.itemTypes[`${MODULE_ID}.feat`].filter((o) => o.system.subType === "feat");
        const owned = ownedItems.length;
        const active = ownedItems.filter((o) => o.isActive).length;

        return {
            max: this.system.feats.max,
            levels: this.system.details.level,
            owned,
            active,
            disabled: owned - active,
            formula: 0,
            changes: 0,
            // Count totals
            get discrepancy() {
                return this.max - this.active;
            },
            get missing() {
                return Math.max(0, this.discrepancy);
            },
            get excess() {
                return Math.max(0, -this.discrepancy);
            },
        };
    }

    getWagonCount() {
        const owned = this.system.wagons.owned;
        const active = this.itemTypes[`${MODULE_ID}.wagon`].filter((o) => o.isActive).length;

        const counts = {};
        for (const [id, count] of Object.entries(this.system.wagons.counts)) {
            counts[id] = {
                owned: count.count,
                max: count.max,
                get discrepancy() {
                    return this.max !== undefined ? (this.max - this.owned) : 0;
                },
                get missing() {
                    return Math.max(0, this.discrepancy);
                },
                get excess() {
                    return Math.max(0, -this.discrepancy);
                },
            };
        }

        return {
            max: this.system.wagons.max,
            base: 5,
            owned,
            active,
            disabled: owned - active,
            formula: 0,
            changes: 0,
            counts,
            // Count totals
            get discrepancy() {
                return this.max - this.active;
            },
            get missing() {
                return Math.max(0, this.discrepancy);
            },
            get excess() {
                return Math.max(0, -this.discrepancy);
            },
        };
    }

    getTravelerCount() {
        const owned = this.system.travelers.owned;
        const active = this.itemTypes[`${MODULE_ID}.traveler`].filter((o) => o.isActive).length;
        const wagons = this.itemTypes[`${MODULE_ID}.wagon`];
        const byWagons = wagons.reduce((acc, wagon) => acc + wagon.system.capacity.traveler, 0);

        const counts = {};
        for (const [id, count] of Object.entries(this.system.travelers.counts)) {
            counts[id] = {
                owned: count.count,
                max: count.max,
                get discrepancy() {
                    return this.max !== undefined ? (this.max - this.owned) : 0;
                },
                get missing() {
                    return Math.max(0, this.discrepancy);
                },
                get excess() {
                    return Math.max(0, -this.discrepancy);
                },
            };
        }

        const result = {
            max: this.system.travelers.max,
            base: 0,
            wagons: byWagons,
            owned,
            active,
            disabled: owned - active,
            formula: 0,
            changes: 0,
            counts,
            // Count totals
            get discrepancy() {
                return this.max - this.active;
            },
            get missing() {
                return Math.max(0, this.discrepancy);
            },
            get excess() {
                return Math.max(0, -this.discrepancy);
            },
        };

        return result;
    }

    getCargoCount() {
        const wagons = this.itemTypes[`${MODULE_ID}.wagon`];
        const byWagons = wagons.reduce((acc, wagon) => acc + wagon.system.capacity.cargo, 0);

        const owned = this.system.cargo.owned;

        return {
            max: this.system.cargo.max,
            base: 0,
            wagons: byWagons,
            owned,
            active: owned,
            disabled: 0,
            formula: 0,
            changes: 0,
            // Count totals
            get discrepancy() {
                return this.max - this.active;
            },
            get missing() {
                return Math.max(0, this.discrepancy);
            },
            get excess() {
                return Math.max(0, -this.discrepancy);
            },
        };
    }


    formatContextNotes(notes, rollData, {roll = true} = {}) {
        const result = [];
        rollData ??= this.getRollData();
        for (const noteObj of notes) {
            rollData.item = {};
            if (noteObj.item != null) rollData = noteObj.item.getRollData();

            for (const note of noteObj.notes) {
                result.push(
                    ...note
                        .split(/[\n\r]+/)
                        .map((subNote) => pf1.utils.enrichHTMLUnrolled(subNote, {
                            rollData,
                            rolls: roll,
                            relativeTo: this
                        }))
                );
            }
        }
        return result;
    }

    get allNotes() {
        return this.items
            .filter((item) =>
                item.type.startsWith(`${MODULE_ID}.`)
                && item.isActive
                && (item.system.contextNotes?.length > 0 || item.system._contextNotes?.length > 0)
            )
            .map((item) => {
                const notes = [];
                notes.push(...(item.system.contextNotes ?? []));
                notes.push(...(item.system._contextNotes ?? []));
                return {notes, item};
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

    getContextNotesParsed(context, {roll = true} = {}) {
        if (context === "attacks.attack") context = "caravan_attack";

        const noteObjects = this.getContextNotes(context);
        return noteObjects.reduce((cur, o) => {
            for (const note of o.notes) {
                const enrichOptions = {
                    rollData: o.item != null ? o.item.getRollData() : this.getRollData(),
                    rolls: roll,
                    async: false,
                    relativeTo: this,
                };
                cur.push(pf1.utils.enrichHTMLUnrolled(note, enrichOptions));
            }

            return cur;
        }, []);
    }

    async convertTreasure(options = {}) {
        const treasure = this.items.filter((item) => !item.type.startsWith(`${MODULE_ID}.`) && item.system.quantity);
        const newGold = pf1.utils.currency.split(treasure.reduce((acc, item) => acc + item.system.price * item.system.quantity, 0) * 100);
        const currentGold = this.system.currency;

        this.update({
            system: {
                currency: {
                    pp: currentGold.pp + newGold.pp,
                    gp: currentGold.gp + newGold.gp,
                    cp: currentGold.cp + newGold.cp,
                    sp: currentGold.sp + newGold.sp,
                }
            }
        })
        await Promise.all(treasure.map((item) => options.delete ? item.delete() : item.update({"system.quantity": 0})));
    }

    async performRest(options = {}) {
        options.hours ??= 12;
        const {
            restoreDailyUses = true,
            hours = 12,
            magicalProvisions = 0,
            verbose = false,
            restTravelers = true
        } = options;

        const provisions = this.system.attributes.provisions;
        const consumption = Math.max(0, this.system.attributes.consumption - magicalProvisions);

        const updateData = {};
        const chatMessageData = options;

        if (provisions >= consumption) {
            chatMessageData.hadProvisions = true;
            chatMessageData.consumedProvisions = consumption;

            if (restTravelers) {
                const actorIds = this.itemTypes[`${MODULE_ID}.traveler`]
                    .filter(traveler => traveler.system.actorId !== undefined)
                    .map(traveler => traveler.system.actorId);

                chatMessageData.restedActors = (await Promise.all(actorIds.map(async actorId => {
                    const actor = await fromUuid(actorId);
                    if (!actor) {
                        return null;
                    }

                    actor.performRest(options);
                    return actorId;
                }))).filter(actorName => actorName !== null);
            }

            updateData["system.attributes.provisions"] = provisions - consumption;
            switch (this.system.details.condition) {
                case "exhausted":
                    updateData["system.details.condition"] = "fatigued";
                    chatMessageData.conditionChangedTo = "fatigued";
                    break;

                default:
                    updateData["system.details.condition"] = "normal";
                    chatMessageData.conditionChangedTo = "normal";
                    break;
            }
        } else {
            chatMessageData.hadProvisions = false;
            chatMessageData.consumedProvisions = provisions;

            // Caravan takes damage
            updateData["system.attributes.provisions"] = 0;

            if (this.system.details.condition === "normal") {
                updateData["system.details.condition"] = "fatigued";
                chatMessageData.conditionChangedTo = "fatigued";
            }

            const damageRoll = await RollPF.safeRollAsync("1d6", {}, {}, {suppressError: true});
            chatMessageData.damageTaken = damageRoll;

            updateData["system.attributes.hp.value"] = this.system.attributes.hp.value - damageRoll.total;
        }

        const context = {pf1: {action: "rest", restOptions: options}};
        if (!foundry.utils.isEmpty(updateData)) await this.update(updateData, foundry.utils.deepClone(context));

        await sendRestChatMessage(this, chatMessageData);

        if (verbose) {
            const message = restoreDailyUses ? "PF1.FullRestMessage" : "PF1.RestMessage";
            ui.notifications.info(game.i18n.format(message, {name: this.token?.name ?? this.name, hours}));
        }

        return {options};
    }
}