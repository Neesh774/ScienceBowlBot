const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const { moderators, admins } = require("../config.json");

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
            await interaction.channel.send(`${m.author.username} from ${team} answered the tossup first. Moderator, please indicate whether or not the answer was correct.`);
            
            const filter = (reaction, user) => {
                return (reaction.emoji.name === "✅" || reaction.emoji.name === "❌") && user.id === interaction.user.id;
            };
            const collector = m.createReactionCollector({ filter, time: 60000 });

            collector.on("collect", async r => {
                if (r.emoji.name === "✅") {
                    team === "A" ? game.teamAScore += 4 : game.teamBScore += 4;
                    game.bonus = team;
                    await game.save();
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
                        .setDisabled(false);
                    const cancel = new MessageButton()
                        .setLabel("Cancel")
                        .setStyle("DANGER")
                        .setCustomId("deleteQuestion");
                    
                    const row = new MessageActionRow()
                        .addComponents(tossup, bonus, cancel);
                    await interaction.message.edit({ embeds: [embed], components: [row] });

                    interaction.channel.send(`4 points were awarded to Team ${team}. They now have **${team === "A" ? game.teamAScore : game.teamBScore}** points.`);
                } else {
                    if(attempt === 2) {
                        interaction.channel.send("The tossup was incorrect, this thread will be archived.");
                        await interaction.channel.setArchived(true);
                        return;
                    }
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
                    
                    interaction.channel.send({ content: `${m.author.username} answered the tossup incorrectly. If it was an interrupt, press the interrupt button. If not, press the archive button and the thread will be archived.`, components: [row]});
                    const filter = i => (i.customId === "interrupt" || i.customId === "archive") && (i.member.roles.cache.has(moderators) || i.member.roles.cache.has(admins) || i.member.id === interaction.user.id);
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
                    interaction.channel.send(`The **7** second timer for ${team === "A"? "B" : "A"} has been started.`);
                    attempt ++;
                    this.tossup(interaction, game, attempt);
                }
            });
        });
        collector.on("end", async () => {
            if(!collected) {
                await interaction.channel.send("There were no answers, this thread will be archived.");
                await interaction.channel.setArchived(true);
            }
        });
    }
};