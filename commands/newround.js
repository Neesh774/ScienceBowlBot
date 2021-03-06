const { SlashCommandBuilder } = require("@discordjs/builders");
const BowlGame = require("../schemas/BowlGame");
const { sendQuestionOptions } = require("../util/sendQuestionOptions");
module.exports = {
	data: new SlashCommandBuilder()
		.setName("newround")
		.setDescription(
			"Creates a new thread for the next round."
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
		
        game.round ++;
		game.question = 0;
		await game.save();

		const thread = await interaction.channel.threads.create({
			name: `round ${game.round}`,
			autoArchiveDuration: 60,
			reason: `New question created by ${interaction.user.tag}`
		});
		const message = await sendQuestionOptions(game, thread, interaction);
		await message.pin();

		await game.teamA.forEach(async memberId => {
			const member = await interaction.guild.members.fetch(memberId);
			await thread.members.add(member, "Team A");
		});
		await game.teamB.forEach(async memberId => {
			const member = await interaction.guild.members.fetch(memberId);
			await thread.members.add(member, "Team B");
		});
        interaction.editReply({ content: `Created your thread at ${thread.toString()}!`, ephemeral: true });
        game.threads.push({ threadId: thread.id, message: message.id });
        await game.save();
	},
};
