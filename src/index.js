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
  const proRole = newMember.guild.roles.cache.find(role => role.name === 'Pro');
  // Check if the new role is the 'Pro' role
  const newRole = newMember.roles.cache.find(role => role.name === 'Pro');
  const proGroupRoles = oldMember.roles.cache.filter(role => role.name.startsWith('Pro Group - '));
  const proGroupCount = proGroupRoles.size;

  if (proGroupCount === 1) {
    console.log(' newRole: ' + newRole)
    if (newRole === undefined) {
      if (proGroupRoles.size === 0) {
        // The member didn't have any "Pro Group -" roles, do nothing
        return;
      }
      newMember.roles.remove(proGroupRoles)
    }
  }
  else if (newRole === proRole) {
    // Get the category object
    const categoryId = '1077796703408762951';
    const category = newMember.guild.channels.cache.get(categoryId);
    // Get all roles in the server
    const roles = newMember.guild.roles.cache;
    // Filter roles that start with 'Pro Group -'
    const groupRoles = roles.filter(role => role.name.startsWith('Pro Group - '));

    // Loop through each group role and count the number of members
    let assignedRole = null;
    groupRoles.forEach(role => {
      const memberCount = role.members.size;
      if (memberCount < 2 && !assignedRole) {
        // If the group has less than 5 members and a role hasn't been assigned yet, assign the new member to this group
        assignedRole = role;
      } else {
        console.log('Group full')
      }
    });

    if (!assignedRole) {
      // If all groups have 5 members, create a new role and assign it to the new member
      const newRoleName = `Pro Group - ${groupRoles.size + 1}`;
      console.log('group size: ' + groupRoles.size)
      try {
        const newRole = await guild.roles.create({
          data: {
            name: 'test',
            color: 'BLUE',
          },
          reason: 'New group role created',
        });
        newMember.roles.add(newRole);
        // Create a new channel under the specified category
        const channel = await guild.channels.create(`Leads - ${newRole.name}`, {
          type: 'text',
          parent: category,
          permissionOverwrites: [
            {
              id: newMember.guild.id,
              deny: ['VIEW_CHANNEL'],
            },
            {
              id: newRole.id,
              allow: ['VIEW_CHANNEL'],
            },
          ],
        });
        console.log(`New channel created: ${channel.name}`);
      } catch (error) {
        console.error('Error creating new group role:', error);
      }
    } else {
      // If there is an available group with less than 5 members, assign the new member to this group
      newMember.roles.add(assignedRole);
      console.log(`user added to existing group: ${assignedRole.name}`);
    }
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

