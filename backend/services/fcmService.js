const admin = require("firebase-admin");

let messaging = null;

const initializeFCM = () => {
    if (messaging || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        return messaging;
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
            })
        });
    }

    messaging = admin.messaging();
    return messaging;
};

const sendPushNotification = async ({ token, title, body, data = {} }) => {
    const fcm = initializeFCM();

    if (!fcm || !token) {
        return null;
    }

    return fcm.send({
        token,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)]))
    });
};

module.exports = {
    initializeFCM,
    sendPushNotification
};
