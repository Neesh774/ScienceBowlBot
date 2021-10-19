const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton, Collection } = require("discord.js");
const BowlGame = require("../schemas/BowlGame");
const { moderators, admins } = require("../config.json");
const { displayTeam } = require("../util/displayTeam");
const config = require("../config.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("start")
		.setDescription(
			"A moderator command to start a round of science bowl."
		)
		.addStringOption((o) => 
			o
				.setName("team_a")
				.setDescription("The school title for Team A")
				.setRequired(true)
		)
		.addStringOption((o) => 
			o
				.setName("team_b")
				.setDescription("The school title for Team B")
				.setRequired(true)
		),
	permission: "mod",
	async execute(interaction) {
		const game = await BowlGame.findOne({
			channelId: interaction.channel.id
		});
		if (game) {
			interaction.editReply("✋ **|** There is already a game in this channel!");
			return;
		}
        
		interaction.editReply("Let's start bowling! First, let's figure out the teams");
		const teamATitle = interaction.options.getString("team_a") ?? "Team A";
		const teamBTitle = interaction.options.getString("team_b") ?? "Team B";

		const buttonA = new MessageButton()
			.setLabel("Team A")
			.setStyle("PRIMARY")
			.setCustomId("addTeamA");
        
		const buttonB = new MessageButton()
			.setLabel("Team B")
			.setStyle("PRIMARY")
			.setCustomId("addTeamB");

		const buttonCancel = new MessageButton()
			.setLabel("Cancel")
			.setStyle("DANGER")
			.setCustomId("cancel");
        
		const buttonComplete = new MessageButton()
			.setLabel("Complete")
			.setStyle("SUCCESS")
			.setCustomId("complete");
        
		const row = new MessageActionRow()
			.addComponents([buttonA, buttonB, buttonCancel, buttonComplete]);
        
		let teamA = new Collection();
		let teamB = new Collection();
        
		const embed = new MessageEmbed()
			.setColor(config.embedColor)
			.setTitle("🧪 **|** Let's start bowling!")
			.setDescription("Press one of the buttons below to set your team.")
			.addField(`:regional_indicator_a: ${teamATitle}`, "No players", true)
			.addField(`:regional_indicator_b: ${teamBTitle}`, "No players", true);
        
		const joinMessage = await interaction.channel.send({ embeds: [embed], components: [row]});

		const filter = i => (i.customId === "addTeamA" || i.customId === "addTeamB" || i.customId === "cancel" || i.customId === "complete");
		const buttonCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

		buttonCollector.on("collect", async i => {

			if (i.customId === "addTeamA") {
				if(teamA.has(i.user.id)) teamA.delete(i.user.id);
				teamA = teamA.set(i.user.id, i.user);

				teamB.delete(i.user.id);

				const teamADisplay = displayTeam(teamA);
				const teamBDisplay = displayTeam(teamB);
				embed.spliceFields(0, 2, {
					name: `:regional_indicator_a: ${teamATitle}`,
					value: teamADisplay,
					inline: true
				}, {
					name: `:regional_indicator_b: ${teamBTitle}`,
					value: teamBDisplay,
					inline: true
				});
				await i.message.edit({ embeds: [embed], components: [row]});
				i.reply({ content: "You have been added to Team A!", ephemeral: true });
			}

			if (i.customId === "addTeamB") {
				if(teamB.has(i.user.id)) teamB.delete(i.user.id);
				teamB.set(i.user.id, i.user);

				teamA.delete(i.user.id);

				const teamADisplay = displayTeam(teamA);
				const teamBDisplay = displayTeam(teamB);
				embed.spliceFields(0, 2, {
					name: `:regional_indicator_a: ${teamATitle}`,
					value: teamADisplay,
					inline: true
				}, {
					name: `:regional_indicator_b: ${teamBTitle}`,
					value: teamBDisplay,
					inline: true
				});
				await i.message.edit({ embeds: [embed], components: [row]});
				i.reply({ content: "You have been added to Team B!", ephemeral: true });
			}

			if (i.customId === "cancel") {
				if(!i.member.roles.cache.has(moderators) && !i.member.roles.cache.has(admins) && i.user.id != interaction.user.id) return i.reply({ content: "You do not have permission to do this!", ephemeral: true });
				await i.message.edit({ content: "The game has been cancelled!", embeds: [], components: [] });
				i.reply({ content: "Cancelled the game!", ephemeral: true });
				return;
			}

			if (i.customId === "complete") {
				if(!i.member.roles.cache.has(moderators) && !i.member.roles.cache.has(admins) && i.user.id != interaction.user.id) return i.reply({ content: "You do not have permission to do this!", ephemeral: true });
				if (teamA.size === 0 || teamB.size === 0) {
					i.reply({ content: "You need to have at least one player in each team!", ephemeral: true });
					return;
				}

				const game = new BowlGame({
					channelId: interaction.channel.id,
					creatorId: interaction.user.id,
					teamATitle: teamATitle,
					teamA: Array.from(teamA.keys()),
					teamBTitle: teamBTitle,
					teamB: Array.from(teamB.keys()),
					teamAScore: 0,
					teamBScore: 0,
					round: 0,
					threads: [],
					bonus: ""
				});

				await game.save();

				embed.setTitle("🏆 **|** Game has started!");
				buttonA.setDisabled();
				buttonB.setDisabled();
				buttonCancel.setDisabled();
				buttonComplete.setDisabled();
				row.setComponents([buttonA, buttonB, buttonCancel, buttonComplete]);

				i.reply({ content: "Game has started! Use /newround to start a new round.", ephemeral: true });
				return await i.message.edit({ embeds: [embed], components: [row] });
			}
		});
		buttonCollector.on("end", async () => {
			buttonA.setDisabled();
			buttonB.setDisabled();
			buttonCancel.setDisabled();
			buttonComplete.setDisabled();
			row.setComponents([buttonA, buttonB, buttonCancel, buttonComplete]);
			return await joinMessage.edit({ embeds: [embed], components: [row] });
		});
	},
};
