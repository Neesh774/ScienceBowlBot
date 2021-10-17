const { Collection } = require("discord.js");
const button = require("./button.js");
const cooldowns = new Collection();

module.exports = {
	name: "interactionCreate",
	once: false,
	async execute(interaction, client) {
		const { commandName, user, member } = interaction;

		if (!interaction.isCommand() && !interaction.isButton()) return;
		if (interaction.isButton()) button.execute(interaction, client);

		const command = client.commands.get(commandName);
		if (!command) return;

		if (command.guildOnly && !interaction.inGuild()) {
			return interaction.reply({
				content:
					"❌ **|** That command can only be used inside servers.",
				ephemeral: true,
			});
		}

		const isAdmin = client.admins.includes(user.id);

		if (!isAdmin && command.cooldown) {
			if (!cooldowns.has(commandName)) {
				cooldowns.set(commandName, new Collection());
			}

			const now = Date.now();
			const timestamps = cooldowns.get(commandName);
			const cooldownAmount = command.cooldown * 1000;

			if (timestamps.has(user.id)) {
				const expirationTime = timestamps.get(user.id) + cooldownAmount;

				if (now < expirationTime) {
					const timeLeft = ((expirationTime - now) / 1000).toFixed(0);
					return interaction.reply({
						content: `🛑 **|** That command is on cooldown! Wait ${timeLeft} second(s) before using it again.`,
						ephemeral: true,
					});
				}
			}

			timestamps.set(user.id, now);
			setTimeout(() => timestamps.delete(user.id), cooldownAmount);
		}

		if (!isAdmin && command.permission) {
			const isManager = member.permissions.has("MANAGE_GUILD");
			if (command.permission === "mod" && !isManager) {
				return await interaction.reply({
					content: "✋ **|** You must be a science bowl moderator to run this command.",
					ephemeral: true,
				});
			}
		}

		try {
			await interaction.deferReply({ ephemeral: true});
			await command.execute(interaction);
		} catch (error) {
			console.error(`Failed to execute command ${commandName}
            * ${error.stack}`);
			interaction.editReply({
				content:
					"❌ **|** Something went wrong while executing that command!",
				ephemeral: true,
			});
		}
	},
};