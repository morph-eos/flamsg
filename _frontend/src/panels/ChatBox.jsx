import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useCookies } from 'react-cookie';

export default function ChatBox({ backend, chatUpdates, friendUsername, navbarHeight, loadingif, useHome }) {
    // Set up axios to use cookies
    axios.defaults.withCredentials = true;

    // Use the useCookies hook to get cookies
    const [cookies] = useCookies();

    // States for message content, message information, chat, and loading state
    const [msgContent, setMsgContent] = useState('');
    const [msgInfo, setMsgInfo] = useState('Write a message');
    const [chat, setChat] = useState([]);
    const [loadingChat, setLoadingChat] = useState(true);

    // Options for date formatting
    const dateOptions = {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        timeZone: "Europe/Rome"
    };

    // Reference for the chat element
    const chatMessagesRef = useRef(null);

    // Function to fetch the chat from the backend
    const fetchChat = async () => {
        await axios
            .post(backend + '/friends/chatHandler', { friendUsername })
            .then((response) => {
                setChat(response.data);
                setLoadingChat(false); // Set chat loading to false after receiving data
            })
            .catch((error) => {
                console.log(error.response.data.message);
            });
    };

    // Load the chat when the friend's name, backend, or chat update changes
    useEffect(() => {
        // Call the fetchChat function when the friend's name or backend changes
        setLoadingChat(true); // Set chat loading to true before calling fetchChat
        fetchChat(); // Execute the chat axios if a new message has arrived in the currently open chat
    }, [friendUsername, backend]);

    // Load the chat when there's a chat update
    useEffect(() => {
        // Call the fetchChat function when there's a chat update for the current chat
        if (friendUsername) {
            if (chatUpdates.usrs.includes(friendUsername)) {
                // Set chat loading to true before calling fetchChat
                setLoadingChat(true);
                // Execute the chat axios if a new message has arrived in the currently open chat
                fetchChat();
            }
        }
    }, [chatUpdates]);

    // Effect that runs when the chat changes
    useEffect(() => {
        // Scroll the scrollbar to the bottom of the chat-messages element
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chat]);

    const handleMsgInput = (e) => {
        // Handle message input
        setMsgContent(e.target.value);
    };

    const handleMsgSubmit = async (e) => {
        e.preventDefault();
        try {
            const msgToSubmit = msgContent;
            setMsgContent('');
            // Send the message to the backend for submission
            await axios.post(backend + '/friends/messageSubmit', {
                friendUsername: friendUsername,
                message: msgToSubmit
            })
                .then((response) => {
                    setMsgInfo(response.data.message);
                })
                .catch((error) => {
                    setMsgInfo(error.response.data.message);
                });
        } catch (error) {
            setMsgInfo(error);
        }
    };

    return (
        <div className="column">
            {// If it's set not to use the home (skip the chat block), show the chat with the selected friend
                !useHome && (
                    <div className="box chat-box">
                        {/* Message container */}
                        {loadingChat ? ( // If the chat is loading, show the loading GIF
                            <div className="has-text-centered">
                                <img src={loadingif} alt="Loading Gif" />
                            </div>
                        ) : (
                            <div ref={chatMessagesRef} className="has-background-white p-4 chat-messages" style={{ maxHeight: `calc(84vh - ${navbarHeight}px)` }}>
                                {chat.length > 0 && (
                                    // Map of messages in the chat
                                    chat.map((message, i) => (
                                        <div key={i} className={`message ${message.from === cookies.userData._id ? 'is-info' : 'is-link'}`}>
                                            <div className={`message-header ${message.from === cookies.userData._id ? 'is-justify-content-flex-end' : ''}`}>
                                                {/* Message sender */}
                                                <p className="message-sender">{message.from === cookies.userData._id ? 'You' : friendUsername}</p>
                                            </div>
                                            <div className="message-body">
                                                {/* Message content */}
                                                <p className={`${message.from === cookies.userData._id ? 'is-flex is-flex-direction-row-reverse' : ''}`}>{message.content}</p>
                                                {/* Message timestamp */}
                                                <p className={`message-timestamp ${message.from === cookies.userData._id ? 'is-pulled-left' : 'is-pulled-right'}`}>
                                                    {new Date(message.date).toLocaleString("it-IT", dateOptions)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        {/* Form for sending messages */}
                        <form onSubmit={handleMsgSubmit}>
                            <div className="field has-addons has-addons-centered p-3 sendbar">
                                <div className="control is-expanded">
                                    {/* Input for message content */}
                                    <input
                                        className="input"
                                        type="text"
                                        placeholder={msgInfo}
                                        value={msgContent}
                                        onChange={handleMsgInput}
                                    />
                                </div>
                                <div className="control">
                                    {/* Message send button */}
                                    <button className="button is-primary" type="submit">
                                        Send
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
        </div>
    );
}