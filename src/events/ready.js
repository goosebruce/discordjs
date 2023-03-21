const { Events } = require('discord.js');
const commandarray = []; // Array to store commands for sending to the REST API.

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        const commandFiles = fs
            .readdirSync("src/Commands")
            .filter(file => file.endsWith(".js")); // Get and filter all the files in the "Commands" Folder.

        // Loop through the command files
        for (const file of commandFiles) {
            const command = require(`../Commands/${file}`); // Get and define the command file.
            client.commands.set(command.data.name, command); // Set the command name and file for handler to use.
            commandarray.push(command.data.toJSON()); // Push the command data to an array (for sending to the API).
        }

        const rest = new REST({ version: "9" }).setToken(token); // Define "rest" for use in registering commands
        // Register slash commands.
        ; (async () => {
            try {
                console.log("Started refreshing application (/) commands.");

                await rest.put(Routes.applicationCommands(client.user.id), {
                    body: commandarray,
                });

                console.log("Successfully reloaded application (/) commands.");

                await guild.roles.fetch(config.pro_role_id);
                console.log("Successfully fetched pro role members")
            } catch (error) {
                console.error(error);
            }
        })();
        console.log(`Logged in as ${client.user.tag}!`);
    },
};