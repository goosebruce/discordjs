const { REST } = require("@discordjs/rest"); // Define REST.
const { Routes } = require("discord-api-types/v9"); // Define Routes.
const fs = require("fs"); // Define fs (file system).
const express = require('express');
const mysql = require('mysql');
const { Client, Intents, Collection } = require("discord.js"); // Define Client, Intents, and Collection.

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS],
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

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  console.log('working')
  const proRole = newMember.guild.roles.cache.find(role => role.name === 'Pro');
  if (!oldMember.roles.cache.has(proRole.id) && newMember.roles.cache.has(proRole.id)) {
    const existingGroups = newMember.guild.roles.cache.filter(role => role.name.startsWith('Group')).array();
    let group;
    existingGroups.forEach((existingGroup) => {
      if (existingGroup.members.size < 5 && !group) {
        group = existingGroup;
      }
    });
    if (!group) {
      group = await newMember.guild.roles.create({
        data: {
          name: `Group ${existingGroups.length + 1}`
        }
      });
      const category = newMember.guild.channels.cache.get('1077796703408762951');
      const channel = await newMember.guild.channels.create(`Group ${existingGroups.length + 1}`, {
        type: 'text',
        parent: category,
        permissionOverwrites: [
          {
            id: newMember.guild.roles.everyone.id,
            deny: ['VIEW_CHANNEL']
          },
          {
            id: group.id,
            allow: ['VIEW_CHANNEL']
          }
        ]
      });
    }
    await newMember.roles.add(group);
    const groupName = group.name;
    newMember.guild.systemChannel.send(`${newMember.user.tag} has been assigned to ${groupName}.`);
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

