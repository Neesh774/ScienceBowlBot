const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { color } = require("../config.json");
module.exports = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription(
			"sends some information about science bowl commands."
		),
	permission: "mod",
	async execute(interaction) {
		const embed = new MessageEmbed()
            .setColor(color)
            .setTitle("Science Bowl Bot")
            .setDescription("A bot to help manage the science bowl competition. All commands require moderator or admin permissions.")
            .addField("`start <team_a> <team_b>`", "Starts a new game and allows member to choose their teams. Requires the names for each team.")
            .addField("`newround`", "Meant to be used after a game has been started. Creates a new thread and presents options to start questions.")
            .addField("`end`", "Ends the current game and archives all related threads. Games will NOT be recoverable after this command has been run, but old threads will be viewable.")
            .addField("`points`", "Presents options to adjust the scores of each team.");
        interaction.reply({ embeds: [embed], ephemeral: true});
	},
};
