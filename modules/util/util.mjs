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