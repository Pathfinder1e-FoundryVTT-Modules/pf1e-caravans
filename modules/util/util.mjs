export function toCamelCase(string) {
    return string.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

export const getBuffTargets = function (actor, type = "buffs") {
    return foundry.utils.deepClone(
        {
            buffs: pf1.config.buffTargets,
            contextNotes: pf1.config.contextNoteTargets,
        }[type]
    );
}

export function keepUpdateArray(sourceObj, targetObj, keepPath) {
    let newValue = foundry.utils.getProperty(targetObj, keepPath);
    if (newValue == null) return;
    if (Array.isArray(newValue)) {
        if(foundry.utils.getType(newValue[0]) !== "Object") {
            return;
        }

        newValue = Object.assign({}, newValue);
    }

    const newArray = foundry.utils.deepClone(foundry.utils.getProperty(sourceObj, keepPath) || []);

    for (const [key, value] of Object.entries(newValue)) {
        if (foundry.utils.getType(value) === "Object") {
            const subData = foundry.utils.expandObject(value);
            newArray[key] = foundry.utils.mergeObject(newArray[key] || {}, subData);
        } else {
            newArray[key] = value;
        }
    }

    foundry.utils.setProperty(targetObj, keepPath, newArray);
}