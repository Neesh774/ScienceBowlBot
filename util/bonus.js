
const { sendQuestionOptions } = require("./sendQuestionOptions");
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
            await interaction.channel.send(`${m.author.username} from Team ${team} answered the bonus first. Moderator, please indicate whether or not the answer was correct.`);
            
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
                    await sendQuestionOptions(game, interaction.channel, interaction);
                } else {
                    game.bonus = "";
                    await game.save();
                    interaction.channel.send(`No points were awarded to Team ${team}. They now have **${team === "A" ? game.teamAScore : game.teamBScore}** points.`);
                    await sendQuestionOptions(game, interaction.channel, interaction);
                }
            });
        });
    }
};