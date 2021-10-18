const { Schema, model } = require("mongoose");

const BowlGame = new Schema({
	channelId: String,
	creatorId: String,
	teamATitle: String,
	teamA: [String],
	teamACaptain: String,
	teamBTitle: String,
	teamB: [String],
	teamBCaptain: String,
	teamAScore: Number,
	teamBScore: Number,
	round: Number,
	question: Number,
	threads: [{
		threadId: String,
		message: String,
	}],
	bonus: String,
});

module.exports = model("BowlGames", BowlGame);