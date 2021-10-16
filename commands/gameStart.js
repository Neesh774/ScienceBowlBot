const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const BowlGame = require("../schemas/BowlGame");
const { moderators, admins } = require("../config.json");
module.exports = {
	data: new SlashCommandBuilder()
		.setName("start")
		.setDescription(
			"A moderator command to start a round of science bowl."
		),
	permission: "mod",
	async execute(interaction) {
		const game = await BowlGame.findOne({
			channelId: interaction.channel.id
		});
		if (game) {
			interaction.channel.send("✋ **|** There is already a game in this channel!");
			return;
		}
        
		interaction.editReply("Let's start bowling! First, let's figure out the teams");

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
        
		let teamA = [];
		let teamB = [];
        
		const embed = new MessageEmbed()
			.setColor("#42f5aa")
			.setTitle("🧪 **|** Let's start bowling!")
			.setDescription("Press one of the buttons below to set your team.")
			.addField(":regional_indicator_a: Team A", (teamA.length > 0) ? teamA.toString() : "No players", true)
			.addField(":regional_indicator_b: Team B", (teamB.length > 0) ? teamB.toString() : "No players", true);
        
		interaction.channel.send({ embeds: [embed], components: [row]});

		const filter = i => (i.customId === "addTeamA" || i.customId === "addTeamB" || i.customId === "cancel" || i.customId === "complete");
		const buttonCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

		buttonCollector.on("collect", async i => {

			if (i.customId === "addTeamA") {
				if(teamA.includes(i.user)) return i.reply({ content: "You are already in this team!", ephemeral: true });
				teamA.push(i.user);

				teamB = removePlayer(teamB, i.user);

				embed.spliceFields(0, 2, {
					name: ":regional_indicator_a: Team A",
					value: (teamA.length > 0) ? teamA.toString() : "No players",
					inline: true
				}, {
					name: ":regional_indicator_b: Team B",
					value: (teamB.length > 0) ? teamB.toString() : "No players",
					inline: true
				});
				await i.message.edit({ embeds: [embed], components: [row]});
				i.reply({ content: "You have been added to Team A!", ephemeral: true });
			}

			if (i.customId === "addTeamB") {
				if(includesPlayer(teamB, i.user)) return i.reply({ content: "You are already in this team!", ephemeral: true });
				teamB.push(i.user);

				teamA = removePlayer(teamA, i.user);

				embed.spliceFields(0, 2, {
					name: ":regional_indicator_a: Team A",
					value: (teamA.length > 0) ? teamA.toString() : "No players",
					inline: true
				}, {
					name: ":regional_indicator_b: Team B",
					value: (teamB.length > 0) ? teamB.toString() : "No players",
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
				if (teamA.length === 0 || teamB.length === 0) {
					i.reply({ content: "You need to have at least one player in each team!", ephemeral: true });
					return;
				}

				const game = new BowlGame({
					channelId: interaction.channel.id,
					teamA: teamA,
					teamB: teamB,
					teamAScore: 0,
					teamBScore: 0,
					round: 1,
					bonus: ""
				});

				await game.save();

				embed.setTitle("🏆 **|** Game has started!");
				buttonA.disabled = true;
				buttonB.disabled = true;
				buttonCancel.disabled = true;
				buttonComplete.disabled = true;
                
				return await i.message.edit({ embeds: [embed], components: [row] });
			}
		});
	},
};

function removePlayer(arr, value) {
	for (let i = 0; i < arr.length; i++){
		if (arr[i].id === value.id) {
			arr.splice(i, 1);
			break;
		}
	}
	return arr;
}

function includesPlayer(arr, value) {
	// check if there is an item in the array with the same id as the id of the value
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].id === value.id) {
			return true;
		}
	}
	return false;
}