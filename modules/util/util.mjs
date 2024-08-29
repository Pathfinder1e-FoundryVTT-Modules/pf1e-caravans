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
    if (!Array.isArray(newValue)) newValue = Object.entries(newValue);

    const newArray = foundry.utils.deepClone(foundry.utils.getProperty(sourceObj, keepPath) || []);

    newValue.map((element, index) => {
        if (foundry.utils.getType(element) === "Object") {
            const subData = foundry.utils.expandObject(element);
            newArray[index] = foundry.utils.mergeObject(newArray[index] ?? {}, subData);
        } else {
            newArray[index] = element;
        }
    })

    foundry.utils.setProperty(targetObj, keepPath, newArray);
}