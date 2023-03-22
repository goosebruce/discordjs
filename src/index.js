const fs = require("fs"); // Define fs (file system).
const express = require('express');
const mysql = require('mysql');
const { Client, GatewayIntentBits, Collection } = require("discord.js"); // Define Client, Intents, and Collection.
const path = require('path');
const config = require('../config.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
}); // Connect to our discord bot.
client.commands = new Collection();
const token = process.env.DISCORD_TOKEN; // Token from Railway Env Variable.
const port = process.env.PORT
const app = express();

app.use(express.json({
  type: "*/*"
}));
const connection = mysql.createConnection(process.env.MYSQL_URL);
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

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

