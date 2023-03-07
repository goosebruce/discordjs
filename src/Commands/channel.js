const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('new_private_member')
        .setDescription('Creates a new category with two channels.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user who will have access to the channels.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        // If the user can't be found, return an error message
        if (!user) {
            return interaction.reply(`Sorry, I couldn't find that user.`);
        }

        //check for private role only
        const member = interaction.guild.members.cache.get(user.id);
        const roles = member.roles.cache;

        // Check if the user has the "Private" role
        if (!roles.some(role => role.name === 'Private')) {
            return interaction.reply(`${user} doesn't have the "Private" role.`);
        }

        // Create the "leads" channel in the category
        const leadsChannel = await interaction.guild.channels.create(`${user.name}-leads`, {
            type: 'GUILD_TEXT',
            parent: '1075961197683282061',
            permissionOverwrites: [
                // Allow the specified user and their roles to view and send messages in the channels
                {
                    id: user.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL],
                },
                // Deny everyone else from viewing and sending messages in the channels
                {
                    id: interaction.guild.roles.everyone,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES],
                },
            ],
        });

        // Create the "chat" channel in the category
        const chatChannel = await interaction.guild.channels.create(`${user.name}-chat/feedback`, {
            type: 'GUILD_TEXT',
            parent: '1075961197683282061',
            permissionOverwrites: [
                // Allow the specified user and their roles to view and send messages in the channels
                {
                    id: user.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES],
                },
                // Deny everyone else from viewing and sending messages in the channels
                {
                    id: interaction.guild.roles.everyone,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES],
                },
            ],
        });

        // Send a success message
        interaction.reply(`Created a new category with channels ${leadsChannel} and ${chatChannel} !`);
    },
};
