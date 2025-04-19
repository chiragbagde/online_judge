const express = require("express");
const { sql } = require("../database/neon");
const router = express.Router();

router.post("/create", async (req, res) => {
    const {message} = req.body;

    try {
        const result = await sql`
             INSERT INTO notifications (message)
             VALUES (${message})
             RETURNING id
             `
        res.status(201).json({message: "Notification created successfully", id: result[0].id});
    } catch(error){
        console.error("Error creating notification:", error.message);
        res.status(500).send("Internal server error.")
    }
});

router.get("/", async (req, res) => {
    const { userId } = req.query;
    console.log(userId);
    
    try {
        const result = await sql`
            SELECT n.id, n.message, n.created_at, un.read
            FROM user_notification un
            INNER JOIN notifications n ON n.id = un.notification_id
            WHERE un.user_id = ${userId}
            ORDER BY n.created_at DESC
        `;
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching notifications:", error.message);
        res.status(500).send("Internal server error.");
    }
});

router.post("/mark-as-read", async (req, res) => {
    const { userId, notificationId } = req.body;

    try {
        await sql`
            UPDATE user_notification
            SET read = true
            WHERE user_id = ${userId} AND notification_id = ${notificationId}
            `
        res.status(200).json({message: "Marked as read"});
        } catch(error) {
            console.error("Error marking notification as read:", error.message);
            res.status(500).send("Internal server error.");
        }
        
});

module.exports = router;