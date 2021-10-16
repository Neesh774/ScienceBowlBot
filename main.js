const { Client, Collection, Intents } = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");

const config = require("./config.json");

const client = new Client({
	intents: [Intents.FLAGS.GUILDS],
	allowedMentions: { parse: [] },
});

client.admins = config.admins;
client.commands = new Collection();

const commandFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"));
const eventFiles = fs
	.readdirSync("./events")
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}

// eslint-disable-next-line no-undef
process.on("SIGINT", async () => {
	mongoose.connection.close(() => {
		console.log("Closed mongoDB connection");
		client.destroy();
		console.log("Destroyed client");
		// eslint-disable-next-line no-undef
		process.exit(0);
	});
});

client.login(config.token);