import {MODULE_ID} from "../_moduleId.mjs";

export async function sendRestChatMessage(actor, chatMessageData) {

    chatMessageData.actor = actor;
    chatMessageData.description = game.i18n.format("PF1ECaravans.Rest.Description", {
        actorName: `@UUID[Actor.${actor.id}]`,
        hours: chatMessageData.hours
    });
    if (chatMessageData.conditionChangedTo) {
        chatMessageData.newCondition = game.i18n.localize(`PF1ECaravans.Conditions.${chatMessageData.conditionChangedTo.capitalize()}`);
    }

    const msgData = {
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        // user: game.user.id,
        speaker: ChatMessage.getSpeaker({actor: actor}),
        rollMode: game.settings.get('core', 'rollMode'),
        flags: {},
        content: await renderTemplate(`modules/${MODULE_ID}/templates/chat/caravan-rest.hbs`, chatMessageData)
    };

    setProperty(msgData.flags, 'core.canPopout', false);
    setProperty(msgData.flags, `${MODULE_ID}.resting`, true);

    // Make most rolls into public or gm roll type
    if (msgData.rollMode === 'blindroll' || msgData.rollMode === 'selfroll' && !game.user.isGM) msgData.rollMode = 'gmroll';
    if (msgData.rollMode === 'gmroll') msgData.whisper = [...game.users.filter(u => u.isGM || u.id === game.user.id)];
    if (msgData.rollMode === 'selfroll') msgData.whisper = [game.user.id];

    ChatMessage.create(msgData);
}
