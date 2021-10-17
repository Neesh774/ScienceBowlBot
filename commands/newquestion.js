const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const BowlGame = require("../schemas/BowlGame");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("newquestion")
		.setDescription(
			"Creates a new thread for the next question in the round."
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
		await game.save();

		const thread = await interaction.channel.threads.create({
			name: `round ${game.round}`,
			autoArchiveDuration: 60,
			reason: `New question created by ${interaction.user.tag}`
		});
		const embed = new MessageEmbed()
			.setTitle(`Round ${game.round}`)
			.setDescription("Press one of the buttons below to proceed with the round and start their respective timers AFTER the question has been read.")
			.setColor("#42f5aa");
        
		const tossup = new MessageButton()
			.setLabel("Tossup")
			.setStyle("PRIMARY")
			.setCustomId("tossup");
		const bonus = new MessageButton()
			.setLabel("Bonus")
			.setStyle("PRIMARY")
			.setCustomId("bonus")
			.setDisabled(game.bonus === "");
		const cancel = new MessageButton()
			.setLabel("Cancel")
			.setStyle("DANGER")
			.setCustomId("deleteQuestion");
        
		const row = new MessageActionRow()
			.addComponents(tossup, bonus, cancel);
        
        const message = thread.send({ embeds: [embed], components: [row] });
        interaction.editReply({ content: `Created your thread at ${thread.toString()}!`, ephemeral: true });
        game.threads.push({ threadId: thread.id, message: message.id });
        await game.save();
	},
};
