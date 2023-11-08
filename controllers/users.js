const User = require("../models/users.js");
const bcrypt = require("bcryptjs");

module.exports = {
    // Function for registering a new user
    register: async (req, res) => {
        try {
            const { username, password } = req.body; // Extract username and password from the request

            try {
                const existingUser = await User.findOne({ username }); // Search for a user in the database with the same username

                if (existingUser) {
                    // If the user already exists, return a 400 error with an appropriate message
                    return res
                        .status(400)
                        .json({
                            message: "The user you are trying to register already exists",
                        });
                }

                const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

                const newUser = new User({ username, password: hashedPassword }); // Create a new User object with the username and hashed password

                await newUser.save(); // Save the new user in the database

                // Return a success response with an appropriate message
                return res
                    .status(200)
                    .json({
                        message:
                            "Registration successful. You can now log in by clicking the appropriate button.",
                    });
            } catch (error) {
                console.error("Error during registration:", error);
                // If an error occurs during registration, return a 500 error with an appropriate message
                return res.status(500).json({ message: "Error during registration" });
            }
        } catch (error) {
            console.error("Error during data extraction from the body:", error);
            // In case of an error, return a 500 error
            return res
                .status(500)
                .json({ message: "Error during data extraction from the body" });
        }
    },

    // Function for logging in an existing user
    login: async (req, res) => {
        try {
            // Get data from the HTTP request
            const { username, password, rememberMe } = req.body;

            try {
                // Search for a user in the database with the provided username
                const user = await User.findOne({ username });

                // If the user does not exist, return a 401 error
                if (!user) {
                    return res
                        .status(401)
                        .json({ message: "No user with this username exists" });
                }

                // Compare the provided password with the user's password in the database
                const isMatch = await user.comparePassword(password);

                // If the passwords do not match, return a 401 error
                if (!isMatch) {
                    return res.status(401).json({ message: "Incorrect password" });
                }

                // Set the maximum cookie duration based on the rememberMe choice
                const maxAge = rememberMe ? 365 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;

                // Create an object with the cookie data to be saved
                const cookieData = {
                    username: user.username,
                    _id: user._id,
                    access_id: user.password,
                };

                // Cookie options
                const cookieOptions = {
                    maxAge,
                    sameSite: "lax",
                };

                // Set the cookie in the response header
                res.cookie("userData", cookieData, cookieOptions);

                // Return a success message
                return res.status(200).json({ message: "Login successful" });
            } catch (error) {
                console.error("Error during login:", error);

                // In case of an error, return a 500 error
                return res.status(500).json({ message: "Error during login" });
            }
        } catch (error) {
            console.error("Error during data extraction from the body:", error);
            // In case of an error, return a 500 error
            return res
                .status(500)
                .json({ message: "Error during data extraction from the body" });
        }
    },

    // Function to get user information by their ID
    userById: async (req, res) => {
        try {
            // Extract the user ID from the request
            const { userId } = req.body;

            try {
                // Search for the user in the database using the ID
                const user = await User.findOne({ _id: userId });

                if (!user) {
                    // If the user is not found, return a response with a 404 status (not found)
                    return res.status(404).json({ message: "User not found" });
                }

                // If the user is found, return a response with a 200 status (OK) and the user's information
                return res.status(200).json({ username: user.username });
            } catch (error) {
                // In case of an error during the user search, handle the error and return a response with a 500 status (server error)
                console.error("Error during user search:", error);
                return res.status(500).json({ message: "Error during user search" });
            }
        } catch (error) {
            // Handle errors during the extraction of the user ID from the request
            console.error("Error during user ID extraction:", error);
            return res
                .status(500)
                .json({ message: "Error during user ID extraction" });
        }
    },

    // Function to check the correctness of cookies and/or delete the user's event emitter and clear the user's cookies
    logOrQuit: async (req, res) => {
        try {
            let userCookies;
            // Extract cookie data
            if (req.cookies.userData.username) {
                userCookies = req.cookies.userData;
            } else {
                userCookies = JSON.parse(req.cookies.userData);
            }
            const { username, _id, access_id } = userCookies;
            const password = access_id;

            try {
                // Extract and check the exit mode of logOrQuit
                const { exit } = req.body;

                if (!exit) {
                    // Check for the presence of the user in the database
                    const userObj = await User.findOne({ username, _id, password });

                    if (userObj) {
                        // Return a positive response if the user is found in the database
                        return res.status(200).json({ message: 'Cookies verified', pendingFList: userObj.pendingFList });
                    }
                }
            } catch (error) {
                // Handle errors in data checking
                console.error("Error during data checking:", error);
            }
        } catch (error) {
            // Handle errors when user data is not present in cookies
            console.error("Error importing data from the cookie:", error);
        }

        // If the user was not found in cookies, there was an error during checking, or the function is called for logout
        // Clear all user data from cookies
        try {
            // Remove the WebSocket client corresponding to the user
            req.wss.clients.forEach((client) => {
                if (client.userData && client.userData._id === _id) {
                    client.terminate(); // Close the WebSocket connection
                }
            });

            // Clear the user's cookies
            res.clearCookie("userData");

            // Set a cookie with an empty value and a past expiration date to remove it on the client
            res.cookie("userData", "", { expires: new Date(0) });

            // Return a positive response to confirm the logout
            return res.status(200).json({ message: "Logout successful" });
        } catch (error) {
            // Handle errors during logout
            console.error("Error during logout:", error);
            return res.status(500).json({ message: "Error during logout" });
        }
    },
};