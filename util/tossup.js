const { MessageActionRow, MessageButton } = require("discord.js");
const { moderators, admins } = require("../config.json");
const { sendQuestionOptions } = require("./sendQuestionOptions");

module.exports = {
    async tossup(interaction, game, attempt) {
        let collected = false;
        const tossupFilter = (m) => {
            return game.teamA.includes(m.author.id) || game.teamB.includes(m.author.id);
        };
        const collector = interaction.channel.createMessageCollector({ filter: tossupFilter, time: 7000 });

        collector.on("collect", async m => {
            collected = true;
            let team = "A";
            if (game.teamB.includes(m.author.id)) team = "B";
            await m.react("✅");
            await m.react("❌");
            await interaction.channel.send(`${m.author.username} from Team ${team} answered the tossup first. Moderator, please indicate whether or not the answer was correct.`);
            
            const filter = (reaction, user) => {
                return (reaction.emoji.name === "✅" || reaction.emoji.name === "❌") && user.id === interaction.user.id;
            };
            const collector = m.createReactionCollector({ filter, time: 60000 });

            collector.on("collect", async r => {
                if (r.emoji.name === "✅") {
                    team === "A" ? game.teamAScore += 4 : game.teamBScore += 4;
                    game.bonus = team;
                    await game.save();

                    interaction.channel.send(`4 points were awarded to Team ${team}. They now have **${team === "A" ? game.teamAScore : game.teamBScore}** points.`);
                    await sendQuestionOptions(game, interaction.channel, interaction);
                } else {
                    if(attempt === 2) {
                        interaction.channel.send({ content: "The tossup was incorrect, we will now move on to the next question." });
                        sendQuestionOptions(game, interaction.channel, interaction);
                        return;
                    }
                    const interrupt = new MessageButton()
                        .setLabel("Interrupt")
                        .setStyle("DANGER")
                        .setCustomId("interrupt");
                    const continueRound = new MessageButton()
                        .setLabel("Continue")
                        .setStyle("SUCCESS")
                        .setCustomId("continue");
                    const row = new MessageActionRow()
                        .addComponents([interrupt, continueRound]);
                    
                    const incorrectTossup = interaction.channel.send({ content: `${m.author.username} answered the tossup incorrectly. If it was an interrupt, press the interrupt button. If not, press the continue button and we will proceed to the next question. Do nothing to allow the other team to answer.`, components: [row]});
                    const filter = i => (i.customId === "interrupt" || i.customId === "continue") && (i.member.roles.cache.has(moderators) || i.member.roles.cache.has(admins) || i.member.id === interaction.user.id);
                    const buttonCollector = interaction.channel.createMessageComponentCollector({ filter, time: 5000 });

                    let buttonCollected = false;
                    buttonCollector.on("collect", async i => {
                        if(i.customId === "interrupt") {
                            team === "A" ? game.teamBScore += 4 : game.teamAScore += 4;
                            await game.save();
                            return await i.reply({ content: `${team === "A" ? "B" : "A"} was given **4** points. They now have **${team === "A" ? game.teamBScore : game.teamAScore}** points`, ephemeral: true});
                        }
                        else if(i.customId === "continue") {
                            buttonCollected = true;
                            i.reply({ content: "Continuing to the next question", ephemeral: true});
                            return await sendQuestionOptions(game, interaction.channel, interaction);
                        }
                    });
                    buttonCollector.on("end", async () => {
                        if (!buttonCollected) {
                            interaction.channel.send(`The **7** second timer for team ${team === "A"? "B" : "A"} has been started.`);
                            attempt ++;
                            this.tossup(interaction, game, attempt);
                        }
                        interrupt.setDisabled(true);
                        continueRound.setDisabled(true);
                        row.setComponents([interrupt, continueRound]);
                        incorrectTossup.edit({ content: `${m.author.username} answered the tossup incorrectly. If it was an interrupt, press the interrupt button. If not, press the continue button and we will proceed to the next question. Do nothing to allow the other team to answer.`, components: [row]});
                    });
                    const message = await interaction.channel.send(`Team ${team === "A"? "B" : "A"}'s timer will start in 5 seconds.`);
                    for(let i = 5; i > 0; i--) {
                        if(!buttonCollected) {
                            await message.edit(`Team ${team === "A"? "B" : "A"}'s timer will start in ${i}`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                    await message.delete();
                }
            });
        });
        collector.on("end", async () => {
            if(!collected) {
                await interaction.channel.send("There were no answers, we will now move on to the next question.");
                sendQuestionOptions(game, interaction.channel, interaction);
            }
        });
    }
};