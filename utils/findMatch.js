const User = require("../models/User");

const findMatch = async (userId, userGender, userInterests) => {
    console.log(`Finding match for userId: ${userId}, gender: ${userGender}, interests: ${userInterests}`);

    try {
        const users = await User.find({ _id: { $ne: userId }, isOnline: true });

        let bestMatch = null;
        let maxCommonInterests = -1;

        users.forEach((candidate) => {
            let commonInterests = candidate.interests.filter((interest) => {
                return userInterests.includes(interest);
            }).length;

            if (candidate.gender !== userGender) {
                console.log(`Candidate ${candidate.userId} is a gender match.`);
                commonInterests += 2;
            }

            if (commonInterests > maxCommonInterests) {
                maxCommonInterests = commonInterests;
                bestMatch = candidate;
            }
        });

        return bestMatch;
    } catch (error) {
        console.error("Error in findMatch:", error);
        return null;
    }
};

module.exports = findMatch;
