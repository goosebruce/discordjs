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
        // Get the user's Discord username from the command's input
        const username = interaction.options.getString('username');

        // Find the user by their username
        const user = interaction.options.getUser('user');
        console.log(user)
        // If the user can't be found, return an error message
        if (!user) {
            return interaction.reply(`Sorry, I couldn't find that user.`);
        }

        // Create the new category
        const category = await interaction.guild.channels.create(`Private Member - ${user.username}`, {
            type: 'GUILD_CATEGORY',
            permissionOverwrites: [
                // Allow the specified user to view and send messages in the channels
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

        // Create the "leads" channel in the category
        const leadsChannel = await interaction.guild.channels.create('leads', {
            type: 'GUILD_TEXT',
            parent: category,
        });

        // Create the "chat" channel in the category
        const chatChannel = await interaction.guild.channels.create('chat', {
            type: 'GUILD_TEXT',
            parent: category,
        });

        // Send a success message
        interaction.reply(`Created a new category with channels ${leadsChannel} and ${chatChannel}!`);
    },
};
