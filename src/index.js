const { REST } = require("@discordjs/rest"); // Define REST.
const { Routes } = require("discord-api-types/v9"); // Define Routes.
const fs = require("fs"); // Define fs (file system).
const express = require('express');
const mysql = require('mysql');
const { Client, Intents, Collection } = require("discord.js"); // Define Client, Intents, and Collection.

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
}); // Connect to our discord bot.
const commands = new Collection(); // Where the bot (slash) commands will be stored.
const commandarray = []; // Array to store commands for sending to the REST API.
const token = process.env.DISCORD_TOKEN; // Token from Railway Env Variable.
const port = process.env.PORT
const app = express();
app.use(express.json({
  type: "*/*" // optional, only if you want to be sure that everything is parsed as JSON. Wouldn't recommend
}));
const connection = mysql.createConnection(process.env.MYSQL_URL);

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

client.on('guildMemberAdd', async (member) => {
  // Check if the member has the role "pro"
  if (!member.roles.cache.some(role => role.name === 'pro')) return;

  // Get the guild and number of members with the "pro" role
  const guild = member.guild;
  const proRole = guild.roles.cache.find(role => role.name === 'pro');
  const proMembers = proRole.members.size;

  // Check if there are enough members to create a new channel and role
  if (proMembers % 5 === 0) {
    // Create a new role with the name A1, A2, A3, etc
    const newRole = await guild.roles.create({
      data: {
        name: `A${proMembers / 5}`
      }
    });

    // Assign the new role to the 5 members
    const members = proRole.members.array().slice(proMembers - 5, proMembers);
    members.forEach(async (member) => {
      await member.roles.add(newRole);
    });

    // Create a new channel with the name A1, A2, A3, etc
    const newChannel = await guild.channels.create(`Pro Leads - A${proMembers / 5}`, {
      type: 'text',
      parent: '1077796703408762951' // Replace CATEGORY_ID with the ID of the category you want to create the channel in
    });

    // Set permissions for the new channel
    newChannel.overwritePermissions([
      {
        id: guild.roles.everyone.id,
        deny: ['VIEW_CHANNEL']
      },
      {
        id: newRole.id,
        allow: ['VIEW_CHANNEL']
      }
    ]);

    // Send a message in the new channel to notify the members
    newChannel.send(`A new group has been formed!`);
  }
});

////////////////////////////////////////////////////////////////////////
// Set up a route to accept the webhook
app.post('/webhook', (req, res) => {
  // Parse the JSON payload from the webhook request body
  const payload = req.body
  connection.connect();
  // Respond with a 200 OK status code to acknowledge receipt of the webhook
  const { id, discord_id, discord_username, created_at, email, valid, cancel_at_period_end, expires_at, name } = req.body;

  // Insert the parameters into the database
  connection.query('INSERT INTO users SET ?', { id, discord_id, discord_username, created_at, email, valid, cancel_at_period_end, expires_at, name }, function (error, results, fields) {
    if (error) throw error;
    console.log(results);
  });
  // Close the MySQL connection
  connection.end();
  res.sendStatus(200);
});

app.get('/webhook', (req, res) => {
  const html = '<p>server is online</p>';
  res.send(html);
});

// Start the express app
app.listen(port, () => {
  console.log(`Webhook endpoint listening on port ${port}!`);
});
client.login(token); // Login to the bot client via the defined "token" string.

