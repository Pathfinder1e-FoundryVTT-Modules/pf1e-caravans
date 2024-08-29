export function getChangeFlat(result, target, modifierType, value) {
    if (!target.startsWith("caravan_")) return result;

    if (target.startsWith("caravan_travelerRoleLimit_")) {
        const travelerRole = target.split("_")[2];
        result.push(`system.travelers.counts.${travelerRole}.max`);
    }

    if (target.startsWith("caravan_wagonLimit_")) {
        const wagonType = target.split("_")[2];
        result.push(`system.wagons.counts.${wagonType}.max`);
    }

    switch (target) {
        case "caravan_hp":
            result.push("system.attributes.hp.max");
            break;

        case "caravan_wages":
            result.push("system.details.wages");
            break;

        case "caravan_speed":
            result.push("system.details.speed.total");
            break;

        case "caravan_defense":
            result.push("system.statistics.defense.total");
            result.push("system.statistics.armorClass");
            break;

        case "caravan_morale":
            result.push("system.statistics.morale.total");
            result.push("system.statistics.resolve");
            // result.push("system.attributes.unrest.limit");
            break;

        case "caravan_unrest":
            result.push("system.attributes.unrest.limit");
            break;

        case "caravan_mobility":
            result.push("system.statistics.mobility.total");
            result.push("system.statistics.security");
            break;

        case "caravan_offense":
            result.push("system.statistics.offense.total");
            result.push("system.statistics.attack");
            break;

        case "caravan_attack":
        case "caravan_armorClass":
        case "caravan_security":
        case "caravan_resolve": {
            const stat = target.split("_")[1];
            result.push(`system.statistics.${stat}`);
            break;
        }

        case "caravan_consumption":
            result.push("system.attributes.consumption");
            break;

        case "caravan_feats":
        case "caravan_cargo":
        case "caravan_travelers":
        case "caravan_wagons": {
            const key = target.split("_")[1];
            result.push(`system.${key}.max`);
            break;
        }
    }

    return result;
}