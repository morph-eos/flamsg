const User = require("../models/users.js");
const Friend = require("../models/friends.js");
const { ObjectId } = require("mongoose").Types;

// Auxiliary function to check if two users are friends
function friendshipSrc({ userId, friendId }) {
    try {
        // Search for friendship in the database
        return Friend.findOne({
            $or: [
                {
                    $and: [
                        { first: new ObjectId(userId) },
                        { second: new ObjectId(friendId) },
                    ],
                },
                {
                    $and: [
                        { first: new ObjectId(friendId) },
                        { second: new ObjectId(userId) },
                    ],
                },
            ],
        });
    } catch (error) {
        // Handle errors in case there's an issue during the friendship search
        console.error("An error occurred while searching for friendship: ", error);
        throw new Error("Error during friendship search");
    }
}

// Auxiliary function to simplify the usage of the WebSocket Server (WSS)
function easyWS({ clients, data, ids, more }) {
    try {
        // Convert the WebSocket clients set into an array
        const wsArray = Array.from(clients);

        // Create a new array of strings by converting each ID element to strings
        const stringIds = ids.map((id) => id.toString());

        // Iterate through all WebSocket clients in the array
        wsArray.forEach((ws) => {
            // Check if the current WebSocket client's ID is included in the array of IDs converted to strings
            if (stringIds.includes(ws._id.toString())) {
                // Create the message to send
                const message = {
                    type: data,
                    misc: more,
                };

                // Send the message as a JSON string to the current WebSocket client
                ws.send(JSON.stringify(message));
            }
        });
    } catch (error) {
        // Handle errors in case there's an issue during data transmission via WebSocket
        console.error(
            "An error occurred while sending data via WebSocket: ",
            error,
        );
        throw new Error("Error during data transmission via WebSocket");
    }
}

module.exports = {
    // Function to add a friend to a user
    addFriend: async (req, res) => {
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
            const { friendUsername } = req.body; // Extract friendUsername from the request

            try {
                // Find and verify the current user in the database
                const userObj = await User.findOne({ username, _id, password });
                if (!userObj) {
                    return res.status(404).json({ message: "User not found" }); // Return an error if the current user is not found
                }

                // Find and verify the friend user in the database
                const addedUser = await User.findOne({ username: friendUsername });
                if (!addedUser) {
                    return res.status(404).json({ message: "Friend user not found" }); // Return an error if the friend user is not found
                }

                // Check if the added user is the same as the current user
                if (addedUser._id.equals(userObj._id)) {
                    return res
                        .status(401)
                        .json({ message: "You cannot send a friend request to yourself" }); // Return an error if the friend user is the same as the current user
                }

                const isFriend = await friendshipSrc({
                    userId: userObj._id,
                    friendId: addedUser._id,
                });

                // Check if the added user is already a friend of the current user
                if (isFriend) {
                    return res
                        .status(401)
                        .json({
                            message: `User ${addedUser.username} is already your friend`,
                        }); // Return an error if the friend user is already a friend of the current user
                }

                // Check if a friend request has already been sent to the added user
                if (addedUser.pendingFList.includes(userObj._id)) {
                    return res
                        .status(401)
                        .json({
                            message: `You have already sent a friend request to ${addedUser.username}`,
                        }); // Return an error if a friend request has already been sent to the friend user
                }

                // Check if the added user has already sent a friend request to the current user
                if (userObj.pendingFList.includes(addedUser._id)) {
                    return res
                        .status(401)
                        .json({
                            message: `User ${addedUser.username} has already sent you a friend request`,
                        }); // Return an error if the friend user has already sent a friend request to the current user
                }

                // Add the current user to the pending friend requests list of the added user
                addedUser.pendingFList.push(userObj._id);
                await addedUser.save();

                // Activation and usage of WebSocket corresponding to the friend user
                easyWS({
                    clients: req.wss.clients,
                    data: "friendRequest_update",
                    ids: [addedUser._id],
                });

                return res
                    .status(200)
                    .json({ message: "Friend request sent successfully" }); // Return success confirmation
            } catch (error) {
                // General error handling
                console.error("An error occurred while sending the message:", error);
                return res
                    .status(500)
                    .json({ message: "Error while sending a friend request" }); // Return a generic error if an error occurs while sending a friend request
            }
        } catch (error) {
            // Error handling when user data is not present in the request
            console.error("Error while extracting data:", error);
            return res.status(500).json({ message: "Error while extracting data" }); // Return a generic error if an error occurs while extracting user data
        }
    },
    // Function to accept a friend request
    acceptRequest: async (req, res) => {
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
            const { friendUsername } = req.body;

            try {
                // Find and verify the current user in the database
                const userObj = await User.findOne({ username, _id, password });
                if (!userObj) {
                    return res.status(404).json({ message: "User not found" });
                }

                // Find and verify the friend user in the database
                const friendUser = await User.findOne({ username: friendUsername });
                if (!friendUser) {
                    return res.status(404).json({ message: "Friend user not found" });
                }

                // Check if the friend user is already a friend of the current user
                const isFriend = await friendshipSrc({
                    userId: userObj._id,
                    friendId: friendUser._id,
                });
                if (isFriend) {
                    return res
                        .status(401)
                        .json({
                            message: `User ${friendUser.username} is already your friend`,
                        });
                }

                // Check if the current user has a pending friend request from the friend user
                if (!userObj.pendingFList.includes(friendUser._id)) {
                    return res
                        .status(401)
                        .json({
                            message: `You don't have a pending friend request from ${friendUser.username}`,
                        });
                }

                // Create a new Friend object with the IDs of the two users
                const newFriendship = new Friend({
                    first: userObj._id,
                    second: friendUser._id,
                });

                // Save the new friendship in the database
                await newFriendship.save();

                // Remove the friend user from the current user's pending friend requests list
                userObj.pendingFList.pull(friendUser._id);
                await userObj.save();

                // Activation and usage of WebSocket corresponding to the friend user and the current user
                easyWS({
                    clients: req.wss.clients,
                    data: "friendRequest_update",
                    ids: [userObj._id],
                });
                easyWS({
                    clients: req.wss.clients,
                    data: "friendList_update",
                    ids: [userObj._id, friendUser._id],
                });

                return res
                    .status(200)
                    .json({ message: "Friend request accepted successfully" });
            } catch (error) {
                // General error handling
                console.error(
                    "An error occurred while accepting the friend request:",
                    error,
                );
                return res
                    .status(500)
                    .json({ message: "Error while accepting the friend request" });
            }
        } catch (error) {
            // Error handling when user data is not present in the request
            console.error("Error while extracting data:", error);
            return res.status(500).json({ message: "Error while extracting data" });
        }
    },
    // Function to reject a friend request
    rejectRequest: async (req, res) => {
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
            const { friendUsername } = req.body;

            try {
                // Find and verify the current user in the database
                const userObj = await User.findOne({ username, _id, password });
                if (!userObj) {
                    return res.status(404).json({ message: "User not found" });
                }

                // Find and verify the friend user in the database
                const friendObj = await User.findOne({ username: friendUsername });
                if (!friendObj) {
                    return res.status(404).json({ message: "Friend user not found" });
                }

                // Check if the current user has a pending friend request from the friend user
                if (!userObj.pendingFList.includes(friendObj._id)) {
                    return res
                        .status(401)
                        .json({
                            message:
                                "You need to receive a friend request from this user before rejecting it",
                        });
                }

                // Remove the friend user from the current user's pending friend requests list
                userObj.pendingFList.pull(friendObj._id);
                await userObj.save();

                // Activation and usage of WebSocket corresponding to the current user
                easyWS({
                    clients: req.wss.clients,
                    data: "friendRequest_update",
                    ids: [userObj._id],
                });

                return res
                    .status(200)
                    .json({ message: "Friend request rejected successfully" });
            } catch (error) {
                // General error handling
                console.error("An error occurred while sending the message:", error);
                return res
                    .status(500)
                    .json({ message: "Error while sending the message" });
            }
        } catch (error) {
            // Error handling when user data is not present in the request
            console.error("Error while extracting data:", error);
            return res.status(500).json({ message: "Error while extracting data" });
        }
    },
    // Handles the request to get a user's friend list
    friendList: async (req, res) => {
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
                // Find the current user in the database
                const userObj = await User.findOne({ username, _id, password });
                if (!userObj) {
                    return res.status(401).json({ message: "User not found" });
                }

                // Find users added as friends by the current user
                const addedUsers = await Friend.find({
                    $or: [{ first: userObj._id }, { second: userObj._id }],
                });

                // Build an array of friend objects containing ID, username, last message, and date
                const friendsArray = await Promise.all(
                    addedUsers.map(async (friend) => {
                        const { first, second, chat } = friend;
                        const friendId = userObj._id.equals(first) ? second : first;
                        const friendObj = await User.findOne({ _id: friendId });
                        const senderObj = await User.findOne({
                            _id: chat[chat.length - 1]?.from,
                        });

                        return {
                            id: friendId,
                            username: friendObj.username,
                            lastMessage:
                                chat.length > 0 &&
                                senderObj.username + ": " + chat[chat.length - 1]?.content,
                            date:
                                chat.length > 0
                                    ? chat[chat.length - 1]?.date
                                    : new Date("1970-01-01T00:00:00.000Z"),
                        };
                    }),
                );

                // Sort friends by date in descending order
                friendsArray.sort((a, b) => b.date - a.date);

                return res.status(200).json(friendsArray);
            } catch (error) {
                // General error handling
                console.error(
                    "An error occurred while communicating with the server:",
                    error,
                );
                return res
                    .status(500)
                    .json({ message: "Error while retrieving the friend list" });
            }
        } catch (error) {
            // Error handling when user data is not present in the cookies
            console.error("Error while importing data from the cookie:", error);
            return res
                .status(500)
                .json({ message: "Error while importing data from the cookie" });
        }
    },
    // Handles the request to delete a friendship, along with the related chat
    deleteFriend: async (req, res) => {
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
            const { friendUsername } = req.body;

            try {
                // Find the current user in the database
                const userObj = await User.findOne({ username, _id, password });
                if (!userObj) {
                    return res.status(404).json({ message: "User not found" });
                }

                // Find the friend user in the database
                const addedUser = await User.findOne({ username: friendUsername });
                if (!addedUser) {
                    return res.status(404).json({ message: "Friend user not found" });
                }

                // Find the friendship between the friend and the current user
                const friendship = await friendshipSrc({
                    userId: userObj._id,
                    friendId: addedUser._id,
                });
                if (!friendship) {
                    return res.status(404).json({ message: "Friendship not found" });
                } else {
                    // Delete the found friendship
                    await Friend.deleteOne(friendship);
                    // Activate and use the WebSocket corresponding to the friend and the current user
                    easyWS({
                        clients: req.wss.clients,
                        data: "friendList_update",
                        ids: [addedUser._id, userObj._id],
                    });
                    easyWS({
                        clients: req.wss.clients,
                        data: "chat_update",
                        ids: [addedUser._id, userObj._id],
                        more: [addedUser.username, userObj.username],
                    });
                    return res
                        .status(200)
                        .json({
                            message:
                                "Friendship deleted successfully, along with the related chat :(",
                        });
                }
            } catch (error) {
                // General error handling
                console.error("An error occurred while deleting friendship:", error);
                return res
                    .status(500)
                    .json({ message: "Error during friendship deletion" });
            }
        } catch (error) {
            // Error handling when user data is not present in the request
            console.error("Error during data extraction:", error);
            return res.status(500).json({ message: "Error during data extraction" });
        }
    },

    // Handle the request to get the chat between the current user and a specific friend
    chatHandler: async (req, res) => {
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
            const { friendUsername } = req.body;

            try {
                // Check if the user is in the home, and in that case, return an empty array
                if (friendUsername === "" || !friendUsername) {
                    res.status(200).json([]);
                } else {
                    // Find and verify the current user in the database
                    const userObj = await User.findOne({ username, _id, password });
                    if (!userObj) {
                        return res.status(404).json({ message: "User not found" });
                    }

                    // Find and verify the friend user in the database
                    const addedUser = await User.findOne({ username: friendUsername });
                    if (!addedUser) {
                        return res.status(404).json({ message: "Friend user not found" });
                    }

                    // Find the friendship between the current user and the friend user
                    const friendship = await friendshipSrc({
                        userId: userObj._id,
                        friendId: addedUser._id,
                    });
                    if (!friendship) {
                        return res.status(404).json({ message: "Friendship not found" });
                    } else {
                        return res.status(200).json(friendship.chat);
                    }
                }
            } catch (error) {
                // General error handling
                console.error("An error occurred while loading the chat:", error);
                return res.status(500).json({ message: "Error during chat loading" });
            }
        } catch (error) {
            // Error handling when user data is not present in the request
            console.error("Error during data extraction:", error);
            return res.status(500).json({ message: "Error during data extraction" });
        }
    },

    // Handle the request to send a message to a specific friend
    messageSubmit: async (req, res) => {
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
            const { friendUsername, message } = req.body;
            try {
                // Find and verify the current user in the database
                const userObj = await User.findOne({ username, __id, password });
                if (!userObj) {
                    return res.status(404).json({ message: "User not found" });
                }

                // Find and verify the friend user in the database
                const addedUser = await User.findOne({ username: friendUsername });
                if (!addedUser) {
                    return res.status(404).json({ message: "Friend user not found" });
                }

                // Find the friendship between the current user and the friend user
                const friendship = await friendshipSrc({
                    userId: userObj._id,
                    friendId: addedUser._id,
                });
                if (!friendship) {
                    return res.status(404).json({ message: "Friendship not found" });
                }

                // Check if the message is empty
                if (message.trim().length === 0) {
                    return res.status(400).json({ message: "Empty message" });
                }

                // Add the message to the friendship's chat
                friendship.chat.push({
                    from: userObj._id,
                    content: message,
                    date: new Date(),
                });
                await friendship.save();

                // Activate and use the WebSocket corresponding to the current user and the friend user
                easyWS({
                    clients: req.wss.clients,
                    data: "chat_update",
                    ids: [addedUser._id, userObj._id],
                    more: [addedUser.username, userObj.username],
                });
                easyWS({
                    clients: req.wss.clients,
                    data: "friendList_update",
                    ids: [addedUser._id, userObj._id],
                });

                return res.status(200).json({ message: "Message sent successfully" });
            } catch (error) {
                // General error handling
                console.error("An error occurred while sending the message:", error);
                return res
                    .status(500)
                    .json({ message: "Error during message sending" });
            }
        } catch (error) {
            // Error handling when user data is not present in the request
            console.error("Error during data extraction: ", error);
            return res.status(500).json({ message: "Error during data extraction" });
        }
    },
};