
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = 3000;

// MongoDB connection
const MONGO_URL = "mongodb://127.0.0.1:27017";
const DATABASE_NAME = "CollegeClubDB";

const client = new MongoClient(MONGO_URL);
let db;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Collections allowed in our project
const allowedCollections = [
    "students",
    "clubs",
    "events",
    "memberships"
];

// Test route
app.get("/api", (req, res) => {
    res.json({
        message: "College Club Management System API is running!"
    });
});

// Get all records
app.get("/api/:collection", async (req, res) => {
    try {
        const { collection } = req.params;

        if (!allowedCollections.includes(collection)) {
            return res.status(400).json({ error: "Invalid collection" });
        }

        const records = await db.collection(collection)
            .find()
            .toArray();

        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a record
app.post("/api/:collection", async (req, res) => {
    try {
        const { collection } = req.params;

        if (!allowedCollections.includes(collection)) {
            return res.status(400).json({ error: "Invalid collection" });
        }

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body) ||
            Object.keys(req.body).length === 0
        ) {
            return res.status(400).json({ error: "Record data is required" });
        }

        // Prevent clients from setting MongoDB's internal ID
        const { _id, ...record } = req.body;

        const result = await db.collection(collection).insertOne(record);

        res.status(201).json({
            message: "Record added successfully",
            insertedId: result.insertedId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a record
app.put("/api/:collection/:id", async (req, res) => {
    try {
        const { collection, id } = req.params;

        if (!allowedCollections.includes(collection)) {
            return res.status(400).json({ error: "Invalid collection" });
        }

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid record ID" });
        }

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body) ||
            Object.keys(req.body).length === 0
        ) {
            return res.status(400).json({ error: "Updated data is required" });
        }

        const { _id, ...record } = req.body;

        const result = await db.collection(collection).updateOne(
            { _id: new ObjectId(id) },
            { $set: record }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Record not found" });
        }

        res.json({ message: "Record updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a record
app.delete("/api/:collection/:id", async (req, res) => {
    try {
        const { collection, id } = req.params;

        if (!allowedCollections.includes(collection)) {
            return res.status(400).json({ error: "Invalid collection" });
        }

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid record ID" });
        }

        const result = await db.collection(collection).deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Record not found" });
        }

        res.json({ message: "Record deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Connect to MongoDB and start server
async function startServer() {
    try {
        await client.connect();

        db = client.db(DATABASE_NAME);

        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Could not connect to MongoDB:", error.message);
        console.error("Make sure your MongoDB server is running.");
        process.exit(1);
    }
}

startServer();
