const BowlGame = require("../schemas/BowlGame");
const { moderators, admins } = require("../config.json");
const tossup = require("../util/tossup");
const bonus = require("../util/bonus");

const buttons = ["tossup", "bonus", "deleteQuestion"];

module.exports = {
    async execute(interaction) {
        if(!buttons.includes(interaction.customId)) return;
        if(!interaction.member.roles.cache.has(moderators) && !interaction.member.roles.cache.has(admins) && interaction.user.id !== interaction.guild.ownerId) {
            return await interaction.reply({
                content: "✋ **|** You must be a science bowl moderator to run this command.",
                ephemeral: true,
            });
        }
        // Thread buttons
        if (interaction.channel.isThread()) {
            const channelId = interaction.channel.parentId;
            const threadId = interaction.channel.id;
            const game = await BowlGame.findOne({ channelId: channelId });

            if (interaction.customId == "tossup") {
                await interaction.reply({ content: "Started tossup", ephemeral: true});
                await interaction.channel.send("Started the **7** second timer for a tossup!");
                await tossup.tossup(interaction, game, 1);
            }
            else if (interaction.customId == "bonus") {
                interaction.reply({ content: "Started bonus", ephemeral: true});
                interaction.channel.send("Started the **20** second timer for a bonus!");
                await bonus.bonus(interaction, game);
            }
            else if (interaction.customId.startsWith("deleteQuestion")) {
                if(!game) return;
                game.round --;
                game.bonus = "";
                if(game.threads.includes(threadId)) game.threads.splice(game.threads.indexOf(threadId), 1);
                await interaction.reply("Successfully cancelled the question!");
                await interaction.channel.setArchived(true);
                await game.save();
            }
        }
    }
};