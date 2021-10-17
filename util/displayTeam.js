module.exports = {
    displayTeam(team) {
        let string = team.map(p => p.toString()).join("\n").trim();
        return `${team.size > 0? string : "No players"}`;
    },
    endDisplayTeam(team) {
        let string = team.map(p => `<@${p}>`).join("\n").trim();
        return `${team.length > 0? string : "No players"}`;
    }
};