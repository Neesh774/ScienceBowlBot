const { MessageActionRow, MessageButton } = require("discord.js");
const { moderators, admins } = require("../config.json");

module.exports = {
    async bonus(interaction, game) {
        const bonusFilter = (m) => {
            return game[`team${game.bonus}`] && game[`team${game.bonus}`].includes(m.author.id);
        };
        const collector = interaction.channel.createMessageCollector({ filter: bonusFilter, time: 20000 });
        const reminder = setTimeout(() => {interaction.channel.send("There are 5 seconds left!");}, 15000);

        collector.on("collect", async m => {
            const team = game.bonus;
            clearTimeout(reminder);
            await m.react("✅");
            await m.react("❌");
            await interaction.channel.send(`${m.author.username} from ${team} answered the bonus first. Moderator, please indicate whether or not the answer was correct.`);
            
            const filter = (reaction, user) => {
                return (reaction.emoji.name === "✅" || reaction.emoji.name === "❌") && user.id === interaction.user.id;
            };
            const collector = m.createReactionCollector({ filter, time: 60000 });

            collector.on("collect", async r => {
                if (r.emoji.name === "✅") {
                    team === "A" ? game.teamAScore += 10 : game.teamBScore += 10;
                    game.bonus = "";
                    await game.save();
                    interaction.channel.send(`10 points were awarded to Team ${team}. They now have **${team === "A" ? game.teamAScore : game.teamBScore}** points.`);
                } else {
                    const interrupt = new MessageButton()
                        .setLabel("Interrupt")
                        .setStyle("DANGER")
                        .setCustomId("interrupt");
                    const archive = new MessageButton()
                        .setLabel("Archive")
                        .setStyle("SUCCESS")
                        .setCustomId("archive");
                    const row = new MessageActionRow()
                        .addComponents([interrupt, archive]);
                    
                    interaction.channel.send({ content: `${m.author.username} answered the bonus incorrectly. If it was an interrupt, press the interrupt button. If not, press the archive button and the thread will be archived.`, components: [row]});
                    const filter = i => (i.customId === "interrupt" || i.customId === "archive") && (i.member.roles.cache.has(moderators) || i.member.roles.cache.has(admins));
                    const buttonCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

                    buttonCollector.on("collect", async i => {
                        if(i.customId === "interrupt") {
                            team === "A" ? game.teamBScore += 4 : game.teamAScore += 4;
                            await game.save();
                            i.reply({ content: `${team === "A" ? "B" : "A"} was given **4** points. They now have **${team === "A" ? game.teamBScore : game.teamAScore}** points`});
                        }
                        else if(i.customId === "archive") {
                            i.reply({ content: "Archiving the thread..", ephemeral: true});
                            await interaction.channel.setArchived(true);
                        }
                    });
                }
            });
        });
    }
};