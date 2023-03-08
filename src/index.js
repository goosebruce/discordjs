const { REST } = require("@discordjs/rest"); // Define REST.
const { Routes } = require("discord-api-types/v9"); // Define Routes.
const fs = require("fs"); // Define fs (file system).
const express = require('express');
const { Client, Intents, Collection } = require("discord.js"); // Define Client, Intents, and Collection.
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
}); // Connect to our discord bot.
const commands = new Collection(); // Where the bot (slash) commands will be stored.
const commandarray = []; // Array to store commands for sending to the REST API.
const token = process.env.DISCORD_TOKEN; // Token from Railway Env Variable.
const port = process.env.PORT
const app = express();

// Execute code when the "ready" client event is triggered.
client.once("ready", () => {
  const commandFiles = fs
    .readdirSync("src/Commands")
    .filter(file => file.endsWith(".js")); // Get and filter all the files in the "Commands" Folder.

  // Loop through the command files
  for (const file of commandFiles) {
    const command = require(`./Commands/${file}`); // Get and define the command file.
    commands.set(command.data.name, command); // Set the command name and file for handler to use.
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
    } catch (error) {
      console.error(error);
    }
  })();
  console.log(`Logged in as ${client.user.tag}!`);
});
// Command handler.
client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

// Set up a route to accept the webhook
app.post('/webhook', (req, res) => {
  // Parse the JSON payload from the webhook request body
  const payload = req.body;
  console.log(payload);
  // Respond with a 200 OK status code to acknowledge receipt of the webhook
  res.sendStatus(200);
});

app.get('/webhook', (req, res) => {
  const html = '<h1>Server is online</h1>';
  console.log(req.body);
  res.send(html);

});

// Start the express app
app.listen(port, () => {
  console.log(`Webhook endpoint listening on port ${port}!`);
});
client.login(token); // Login to the bot client via the defined "token" string.

