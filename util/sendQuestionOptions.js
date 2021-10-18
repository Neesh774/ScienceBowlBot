const { MessageButton, MessageActionRow, MessageEmbed } = require("discord.js");
const { endDisplayTeam } = require("./displayTeam");
const config = require("../config.json");

module.exports = {
    async sendQuestionOptions(game, channel, interaction) {
        const embed = new MessageEmbed()
			.setTitle(`Round ${game.round}`)
			.setDescription("Press one of the buttons below to proceed with the round and start their respective timers AFTER the question has been read.")
			.addField("Moderator", interaction.user.toString())
			.addField(`:regional_indicator_a: ${(game.teamATitle ?? "Team A")}: ${game.teamAScore}`, endDisplayTeam(game.teamA), true)
			.addField(`:regional_indicator_b: ${(game.teamBTitle ?? "Team B")}: ${game.teamBScore}`, endDisplayTeam(game.teamB), true)
			.setColor(config.embedColor);
        
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
        
        const message = await channel.send({ embeds: [embed], components: [row] });
        return message;
    }
};