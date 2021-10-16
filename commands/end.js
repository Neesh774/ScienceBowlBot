const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const BowlGame = require("../schemas/BowlGame");
const { moderators, admins } = require("../config.json");
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
			interaction.channel.send("✋ **|** There is no game in this channel.");
			return;
		}
		if(!interaction.member.roles.cache.has(admins) && !interaction.member.roles.cache.has(moderators) && interaction.user.id !== game.creatorId) {
			return interaction.editReply("✋ **|** You do not have permissions for this!");
		}
		let winner = game.teamAScore > game.teamBScore ? "Team A" : "Team B";
		if(game.teamAScore === game.teamBScore) winner = "Tie";

		const embed = new MessageEmbed()
			.setColor("#42f5aa")
			.setTitle("Game Ended")
			.setDescription(`The game has ended. ${winner === "Tie" ? `There was a tie, and both teams had a score of ${game.teamAScore}` : `The winner was ${winner} with a score of ${game.teamAScore}`}`)
			.addField(":regional_indicator_a: Team A", (game.teamA.length > 0) ? game.teamA.toString() : "No players", true)
			.addField(":regional_indicator_b: Team B", (game.teamB.length > 0) ? game.teamB.toString() : "No players", true)
			.setFooter(`Ended on round ${game.round}`);

		await game.delete();
		return interaction.channel.send({ embeds: [embed] });
	},
};
