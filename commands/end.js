const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const BowlGame = require("../schemas/BowlGame");
const { endDisplayTeam } = require("../util/displayTeam");
const config = require("../config.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("end")
		.setDescription(
			"Ends a game in your current channel."
		),
	permission: "mod",
	async execute(interaction) {
		const game = await BowlGame.findOne({
			channelId: interaction.channel.id
		});
		if (!game) {
			interaction.editReply({ content: "✋ **|** There is no game in this channel.", ephemeral: true});
			return;
		}
		let winner = game.teamAScore > game.teamBScore ? "Team A" : "Team B";
		if(game.teamAScore === game.teamBScore) winner = "Tie";

		const embed = new MessageEmbed()
			.setColor(config.embedColor)
			.setTitle("Game Ended")
			.setDescription(`The game has ended. ${winner === "Tie" ? `There was a tie, and both teams had a score of ${game.teamAScore}` : `The winner was ${winner} with a score of ${game.teamAScore}`}`)
			.addField(`:regional_indicator_a:: ${game.teamAScore}`, endDisplayTeam(game.teamA, interaction.guild), true)
			.addField(`:regional_indicator_b:: ${game.teamBScore}`, endDisplayTeam(game.teamB, interaction.guild), true)
			.setFooter(`Ended on round ${game.round}`);

		game.threads.forEach(async threadObj => {
			const threadId = threadObj.threadId;
			const thread = await interaction.channel.threads.fetch(threadId).catch(() => {null;});
			thread.setArchived(true).catch(() => {null;});
		});
		await game.delete();
		interaction.editReply({ content: "Ended the game!", ephemeral: true });
		return interaction.channel.send({ embeds: [embed] });
	},
};
