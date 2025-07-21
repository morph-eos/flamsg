const express = require("express");
const app = express(); // Creating an instance of the Express application
const cors = require("cors"); // Middleware for handling Cross-Origin Resource Sharing (CORS) requests
const cookieParser = require("cookie-parser"); // Middleware for parsing HTTP request cookies
const helmet = require("helmet"); // Middleware for Express application security
const WebSocket = require("ws"); // Library for creating WebSocket servers
const path = require("path");

// IMPORTANT: MongoDB URI should be set as environment variable
// Create a .env file with: MONGODB_URI=mongodb://localhost:27017/flamsg
const mongoURI = process.env.MONGODB_URI;

// Creating an instance of WebSocket.Server for real-time communication
const wss = new WebSocket.Server({ noServer: true });

// CORS configuration - allows frontend to communicate with backend
// In production, replace with your actual domain instead of localhost
app.use(
    cors({
        origin: ["https://flamsg.onrender.com", "http://localhost"],
        credentials: true, // Allow cookies to be sent with requests
    }),
);

// Middleware configuration
app.use(cookieParser());
app.use(express.json());
app.use(helmet());

// Serve static files from the "dist" directory (assuming it was created by Vite build)
app.use(express.static(path.join(__dirname, "./_frontend/dist")));

app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "./_frontend/dist/index.html"));
});

// Middleware to make the WebSocket.Server instance global
app.use((req, res, next) => {
    req.wss = wss; // Add the WebSocket.Server instance to the req object
    next();
});

// Connect to the MongoDB database
const mongoose = require("mongoose");
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once("open", () => console.log("✅ Database connection successful"));
db.on("error", (err) => console.error("❌ Database connection error:", err));

// Import routers for different resources
const usersRouter = require("./routes/users.js");
const friendsRouter = require("./routes/friends.js");

app.get("/", (req, res) => {
    res.send("Welcome!");
});

// Routes for user operations
app.use("/users", usersRouter);

// Routes for friend operations
app.use("/friends", friendsRouter);

// Server setup
const server = app.listen(3000, () => {
    console.log("🚀 FlaMSG Server running on port 3000");
    console.log("📝 Frontend served from _frontend/dist");
    console.log("🔗 WebSocket server ready for real-time chat");
});

// Connecting the WebSocket server to the HTTP server
server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        // Get the cookie string from the "cookie" field in the request header
        const cookieHeader = request.headers.cookie;
        if (cookieHeader) {
            // Parse cookies using the "cookie" module
            const cookie = require("cookie");
            const cookies = cookie.parse(cookieHeader);
            // To handle some implementation errors, this check is necessary
            if (cookies.userData) {
                let userData;
                if (cookies.userData.startsWith("j")) {
                    userData = JSON.parse(cookies.userData.substring(2));
                } else {
                    userData = JSON.parse(cookies.userData);
                }
                const userId = userData._id;
                // Add the user ID as a custom property to the WebSocket client
                ws._id = userId;
            }
        }
        wss.emit("connection", ws, request);
    });
});

// WebSocket error handling
wss.on("error", (error) => {
    console.error("WebSocket Error:", error);
});