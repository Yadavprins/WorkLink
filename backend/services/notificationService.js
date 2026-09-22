const Notification = require("../models/Notification");
const User = require("../models/User");
const Worker = require("../models/Worker");
const { sendPushNotification } = require("./fcmService");


// ======================================================
// CREATE NOTIFICATION
// ======================================================

const createNotification = async ({
    recipient,
    recipientRole,
    type,
    title,
    message,
    job = null
}) => {
    try {
        if (!recipient) {
            return null;
        }

        const notification =
            await Notification.create({
                recipient,
                recipientRole,
                type,
                title,
                message,
                job
            });

        const RecipientModel = recipientRole === "worker" ? Worker : User;
        const recipientAccount = await RecipientModel.findById(recipient).select("+fcmToken");

        if (recipientAccount?.fcmToken) {
            await sendPushNotification({
                token: recipientAccount.fcmToken,
                title,
                body: message,
                data: { jobId: job || "" }
            });
        }

        return notification;

    } catch (error) {
        console.error(
            "Notification creation error:",
            error
        );

        // Notification failure should NOT break job flow
        return null;
    }
};


module.exports = {
    createNotification
};