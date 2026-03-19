const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const aliases = require('./aliases');
const settings = require('./global/settings/settings.json');

const focus = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
  ],
});

focus.commands = new Collection();
focus.aliases = new Collection();
focus.prefix = settings.prefix;

function loadCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      focus.commands.set(command.name, command);
      if (command.aliases && Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          focus.aliases.set(alias, command.name);
        }
      }
    }
  }
}

loadCommands(path.join(__dirname, 'Commands'));

for (const [alias, commandName] of Object.entries(aliases)) {
  focus.aliases.set(alias, commandName);
}

const eventsPath = path.join(__dirname, 'Events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    focus.once(event.name, (...args) => event.execute(...args, focus));
  } else {
    focus.on(event.name, (...args) => event.execute(...args, focus));
  }
}

focus.login(settings.token);

mongoose.connect(settings.mongoURI)
  .then(() => console.log('MongoDB baglantisi kuruldu.'))
  .catch(err => console.error('MongoDB baglanti hatasi:', err));

