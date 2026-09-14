const fs = require("fs");
const path = require("path");

const LOG_PATH = path.join(__dirname, "..", "..", "debug-75f4b8.log");

const debugLog = (location, message, data, hypothesisId) => {
    try {
        fs.appendFileSync(
            LOG_PATH,
            `${JSON.stringify({
                sessionId: "75f4b8",
                location,
                message,
                data: data || {},
                timestamp: Date.now(),
                hypothesisId,
                runId: "v1-gap",
            })}\n`
        );
    } catch {
        // Ignore debug log failures.
    }
};

module.exports = debugLog;
