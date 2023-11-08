import React, { useState, useEffect, useRef } from 'react';
import Chats from './panels/Chats';
import ChatBox from './panels/ChatBox';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import { useParams } from 'react-router-dom';

export default function Main({ icon, backend, loadingif }) {
    // Get the friendUsername parameter from the URL
    const { friendUsername } = useParams();

    // Use the react-cookie package to manage cookies
    const [cookies] = useCookies();

    // States used to manage the navbar height, chat updates, and other state variables
    const [navbarHeight, setNavbarHeight] = useState(0);
    const [chatUpdates, setChatUpdates] = useState({ index: 0, usrs: [] });
    const [friendListUpdates, setFriendListUpdates] = useState(0);
    const [friendRequestUpdates, setFriendRequestUpdates] = useState(0);
    const [showAside, setShowAside] = useState(false);
    const [oldUsername] = useState(friendUsername);
    const [useHome, setUseHome] = useState(false);

    // Use a useRef to get the navbar height
    const navbarRef = useRef(null);

    // State to manage the screen width
    const [screenWidth, setScreenWidth] = useState(
        window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    );

    // Set the default configuration for Axios requests
    axios.defaults.withCredentials = true;

    // Initial check and use of the control to clean the ChatBox
    useEffect(() => {
        if (!friendUsername) {
            setUseHome(true);
            // Change the page title using the document.title object in the case of the Homepage
            document.title = document.title.split(' ')[0] + ' - Homepage';
        } else {
            setUseHome(false);
            // Change the page title using the document.title object in the case of chatting with a user
            document.title = document.title.split(' ')[0] + ' -> ' + friendUsername;
        }
    }, [friendUsername]);

    useEffect(() => {
        // Calculate the navbar height after obtaining the reference
        if (navbarRef.current) {
            setNavbarHeight(navbarRef.current.offsetHeight);
        }

        // Add a listener for the window resize event
        const handleResize = () => {
            if (navbarRef.current) {
                setNavbarHeight(navbarRef.current.offsetHeight);
            }
            setScreenWidth(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
        };
        window.addEventListener('resize', handleResize);
        // Set that, if the screen is small enough to make showAside usable, no chat is selected, and the aside is not displayed, to forcibly display it
        if (screenWidth < 1024 && useHome && !showAside) {
            setShowAside(!showAside);
        }

        // Remove the listener when the component is unmounted
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [useHome]);

    useEffect(() => {
        // Allow automatically hiding the chat list whenever a new one is clicked
        if (friendUsername !== oldUsername) {
            setShowAside(!showAside);
        }
    }, [friendUsername]);

    useEffect(() => {
        // Function to handle WebSocket updates
        const handleUpdate = (event) => {
            const message = JSON.parse(event.data);

            // Handle the update based on the message type
            if (message.type === 'friendRequest_update') {
                setFriendRequestUpdates((prevUpdates) => prevUpdates + 1);
            }
            if (message.type === 'friendList_update') {
                setFriendListUpdates((prevUpdates) => prevUpdates + 1);
            }
            if (message.type === 'chat_update') {
                setChatUpdates((prevUpdates) => ({
                    index: prevUpdates.index + 1,
                    usrs: message.misc,
                }));
            }
        };

        // Create a new WebSocket instance based on the specified backend
        let ws;
        if (backend.includes('localhost')) {
            ws = new WebSocket('ws://' + backend.replace(/^(http?:\/\/)?/i, ''));
        } else {
            ws = new WebSocket('wss://' + backend.replace(/^(https?:\/\/)?/i, ''));
        }

        // Handle events coming from the WebSocket
        ws.onmessage = (event) => handleUpdate(event);

        // Close the WebSocket when the component is unmounted
        return () => {
            ws.close();
        };
    }, []);

    return (
        <div className="columns is-gapless is-multiline">
            {/* Upper block */}
            <div className="column is-full">
                <nav className="navbar is-dark is-fixed-top" role="navigation" aria-label="main navigation" ref={navbarRef}>
                    <div className="navbar-brand">
                        <img src={icon} alt="Icon" className="icon" />
                        <h1 className="navbar-item is-size-4">FlaMSG</h1>
                    </div>
                    <div className="navbar-end">
                        {/* Button to show/hide the side panel */}
                        <button
                            className={`button navbar-burger ${showAside ? 'is-active' : ''}`}
                            aria-label="menu"
                            aria-expanded={showAside}
                            onClick={() => setShowAside(!showAside)}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                        <div className="navbar-item has-text-white">Welcome {cookies.userData.username}</div>
                    </div>
                    <div className="navbar-end">
                        {/* Button to exit the application */}
                        <div className="navbar-item">
                            <button className="button is-dark" onClick={() => {
                                // Request for logout
                                axios.post(backend + '/users/logOrQuit', { exit: true })
                                    .catch((error) => {
                                        console.log(error);
                                    });
                                if (cookies) {
                                    // Delete all cookies
                                    document.cookie = Object.keys(cookies).map(cookieKey => `${cookieKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`).join('');
                                }
                                const rootUrl = window.location.origin; // Get the root URL of your site
                                window.location.href = rootUrl; // Navigate to the root route, reloading without retaining any username in the URL
                            }}>Exit</button>
                        </div>
                    </div>
                </nav>
            </div>
            {/* Block below the navbar */}
            <div className="column is-full" style={{ marginTop: navbarHeight }}>
                <div className="columns is-gapless">
                    {/* Main panel */}
                    <div className={`column ${showAside ? (screenWidth < 769 ? 'is-hidden' : 'is-three-quarters') : (screenWidth >= 1024 ? 'is-three-quarters' : 'is-full')}`}>
                        <ChatBox backend={backend} chatUpdates={chatUpdates} friendUsername={friendUsername} navbarHeight={navbarHeight} loadingif={loadingif} useHome={useHome} />
                    </div>
                    {/* Left side panel */}
                    <div className={`column ${screenWidth < 1024 ? (showAside ? 'is-one-quarter' : 'is-hidden') : 'is-one-quarter'}`} style={{ maxHeight: `calc(100vh - ${navbarHeight}px)` }}>
                        <Chats backend={backend} friendListUpdates={friendListUpdates} friendRequestUpdates={friendRequestUpdates} friendUsername={friendUsername} navbarHeight={navbarHeight} setUseHome={setUseHome} />
                    </div>
                </div>
            </div>
        </div>
    );
}