const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const BowlGame = require("../schemas/BowlGame");
const config = require("../config.json");
const { moderators, admins } = require("../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("points")
        .setDescription(
            "Displays options to adjust game points."
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

        const embed = new MessageEmbed()
            .setColor(config.embedColor)
            .setTitle("Team Points")
            .setDescription("Press the buttons below to adjust the points of each team accordingly.")
            .addField(`:regional_indicator_a: ${(game.teamATitle ?? "Team A")}`, `${game.teamAScore} points`, true)
            .addField(`:regional_indicator_b: ${(game.teamBTitle ?? "Team B")}`, `${game.teamAScore} points`, true);

        const AMinusTen = new MessageButton()
            .setLabel("-10")
            .setStyle("SECONDARY")
            .setCustomId("a-10");
        const AMinusFour = new MessageButton()
            .setLabel("-4")
            .setStyle("SECONDARY")
            .setCustomId("a-4");
        const TeamA = new MessageButton()
            .setLabel("Team A")
            .setStyle("PRIMARY")
            .setCustomId("teamA");
        const APlusFour = new MessageButton()
            .setLabel("+4")
            .setStyle("SECONDARY")
            .setCustomId("a+4");
        const APlusTen = new MessageButton()
            .setLabel("+10")
            .setStyle("SECONDARY")
            .setCustomId("a+10");
        const rowA = new MessageActionRow()
            .setComponents(AMinusTen, AMinusFour, TeamA, APlusFour, APlusTen);
        
        const BMinusTen = new MessageButton()
            .setLabel("-10")
            .setStyle("SECONDARY")
            .setCustomId("b-10");
        const BMinusFour = new MessageButton()
            .setLabel("-4")
            .setStyle("SECONDARY")
            .setCustomId("b-4");
        const TeamB = new MessageButton()
            .setLabel("Team B")
            .setStyle("PRIMARY")
            .setCustomId("teamB");
        const BPlusFour = new MessageButton()
            .setLabel("+4")
            .setStyle("SECONDARY")
            .setCustomId("b+4");
        const BPlusTen = new MessageButton()
            .setLabel("+10")
            .setStyle("SECONDARY")
            .setCustomId("b+10");
        const rowB = new MessageActionRow()
            .setComponents(BMinusTen, BMinusFour, TeamB, BPlusFour, BPlusTen);

        const message = await interaction.channel.send({ embeds: [embed], components: [rowA, rowB], ephemeral: false });
        const filter = i => {
            const validButton = (i.customId.startsWith("a+") || i.customId.startsWith("b+") || i.customId.startsWith("a-") || i.customId.startsWith("b-") || i.customId.startsWith("team"));
            const validPerms = (i.member.roles.cache.has(moderators) || i.member.roles.cache.has(admins) || i.member.id === interaction.user.id);
            return validButton && validPerms;
        };
		const buttonCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        buttonCollector.on("collect", async i => {
            if (i.customId.startsWith("a+")) {
                game.teamAScore += parseInt(i.customId.substring(2));
                await game.save();
                embed.fields[0].value = `${game.teamAScore} points`;
                message.edit({ embeds: [embed], components: [rowA, rowB] });
                i.reply({ content: "✅ **|** Points updated.", ephemeral: true });
            } else if (i.customId.startsWith("b+")) {
                game.teamBScore += parseInt(i.customId.substring(2));
                await game.save();
                embed.fields[1].value = `${game.teamBScore} points`;
                message.edit({ embeds: [embed], components: [rowA, rowB] });
                i.reply({ content: "✅ **|** Points updated.", ephemeral: true });
            } else if (i.customId.startsWith("team")) {
                if (i.customId.startsWith("teamA")) {
                    i.reply({ content: `Team A has ${game.teamAScore} points.`, ephemeral: true });
                } else if (i.customId.startsWith("teamB")) {
                    i.reply({ content: `Team B has ${game.teamBScore} points.`, ephemeral: true});
                }
            } else if (i.customId.startsWith("a-")) {
                game.teamAScore -= parseInt(i.customId.substring(2));
                if(game.teamAScore < 0) {
                    game.teamAScore = 0;
                }
                await game.save();
                embed.fields[0].value = `${game.teamAScore} points`;
                message.edit({ embeds: [embed], components: [rowA, rowB] });
                i.reply({ content: "✅ **|** Points updated.", ephemeral: true });
            } else if (i.customId.startsWith("b-")) {
                game.teamBScore -= parseInt(i.customId.substring(2));
                if(game.teamBScore < 0) {
                    game.teamBScore = 0;
                }
                await game.save();
                embed.fields[1].value = `${game.teamBScore} points`;
                message.edit({ embeds: [embed], components: [rowA, rowB] });
                i.reply({ content: "✅ **|** Points updated.", ephemeral: true });
            }
        });

        buttonCollector.on("end", async () => {
            AMinusTen.setDisabled(true);
            AMinusFour.setDisabled(true);
            TeamA.setDisabled(true);
            APlusFour.setDisabled(true);
            APlusTen.setDisabled(true);
            BMinusTen.setDisabled(true);
            BMinusFour.setDisabled(true);
            TeamB.setDisabled(true);
            BPlusFour.setDisabled(true);
            BPlusTen.setDisabled(true);
            message.edit({ embeds: [embed], components: [rowA, rowB] });
        });
    }
};