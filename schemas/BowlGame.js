const { Schema, model } = require("mongoose");

const BowlGame = new Schema({
	channelId: String,
	teamA: [String],
	teamB: [String],
	teamAScore: Number,
	teamBScore: Number,
	round: Number,
	bonus: String,
});

module.exports = model("BowlGames", BowlGame);