const AI_SERVICE_URL =
    process.env.AI_SERVICE_URL || "http://localhost:8000";

const AI_REQUEST_TIMEOUT_MS = 5000;

const requestAI = async (path, body) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`${AI_SERVICE_URL}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "AI request failed");
        return data;
    } finally {
        clearTimeout(timeout);
    }
};


const predictJobDetails = async (description) => {
    let timeout;

    try {
        const controller = new AbortController();
        timeout = setTimeout(
            () => controller.abort(),
            AI_REQUEST_TIMEOUT_MS
        );

        const response = await fetch(
            `${AI_SERVICE_URL}/predict`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ description }),
                signal: controller.signal
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "AI prediction failed"
            );
        }

        return data.prediction;

    } catch (error) {
        console.error(
            "AI Service Error:",
            error.message
        );

        throw new Error("Unable to get AI prediction");
    } finally {
        clearTimeout(timeout);
    }
};

const estimateDynamicPrice = async (payload) => requestAI("/price-estimate", payload);
const analyzeProblemImage = async (imageUrl) => requestAI("/image-detect", { imageUrl });
const detectFakeJob = async (payload) => requestAI("/fake-job", payload);


module.exports = {
    predictJobDetails
    ,estimateDynamicPrice
    ,analyzeProblemImage
    ,detectFakeJob
};
