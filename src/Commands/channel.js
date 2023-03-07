const { SlashCommandBuilder } = require("@discordjs/builders");
const { Client } = require("discord.js");

const childChannelConfig = {
    type: 'text',
    // under the parent category
    parent, // shorthand for parent: parent
    permissionOverwrites: [
        { id: message.guild.id, deny: ['VIEW_CHANNEL'] },
        { id: message.author.id, allow: ['VIEW_CHANNEL'] },
    ]
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("private")
        .setDescription("New Private Member"),
    execute: async (interaction, client) => {
        return Client.message.guild.create('general', {
            ...childChannelConfig,
            type: 'voice',
        }).catch(console.error)
    },
};