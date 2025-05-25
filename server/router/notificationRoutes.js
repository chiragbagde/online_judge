const express = require("express");
const { sql } = require("../database/neon");
const router = express.Router();
const verifyToken = require("../verifyToken");
const logger = require("../services/logger");

router.post("/create",verifyToken, async (req, res) => {
    const {message} = req.body;

    try {        
        const result = await sql`
             INSERT INTO notifications (message)
             VALUES (${message})
             RETURNING id
             `
        res.status(201).json({message: "Notification created successfully", id: result[0].id});
    } catch(error){
        logger.error("Error creating notification:", error.message);
        res.status(500).send("Internal server error.")
    }
});

router.get("/",verifyToken, async (req, res) => {
    const { userId } = req.query;
    logger.info(userId);
    
    try {
        const missingNotifications = await sql`
            SELECT n.id AS notification_id
            FROM notifications n
            LEFT JOIN user_notification un
            ON n.id = un.notification_id AND un.user_id = ${userId}
            WHERE un.notification_id IS NULL
        `;

        if(missingNotifications.length > 0) {
            await Promise.all(
                missingNotifications.map((notification) => (
                    sql`
                        INSERT INTO user_notification (user_id, notification_id, read)
                        VALUES (${userId}, ${notification.notification_id}, false)

                    `
                ))
            )
        }

        const result = await sql`
            SELECT n.id, n.title, n.body, n.created_at, un.read
            FROM user_notification un
            INNER JOIN notifications n ON n.id = un.notification_id
            WHERE un.user_id = ${userId}
            ORDER BY n.created_at DESC
        `;
        res.status(200).json(result);
    } catch (error) {
        logger.error("Error fetching notifications:", error.message);
        res.status(500).send("Internal server error.");
    }
});

router.post("/mark-as-read",verifyToken, async (req, res) => {
    const { userId, notificationId } = req.body;

    try {
        await sql`
            UPDATE user_notification
            SET read = true
            WHERE user_id = ${userId} AND notification_id = ${notificationId}
            `
        res.status(200).json({message: "Marked as read"});
        } catch(error) {
            logger.error("Error marking notification as read:", error.message);
            res.status(500).send("Internal server error.");
        }
        
});

module.exports = router;