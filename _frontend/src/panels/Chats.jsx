import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';

export default function Chats({ backend, friendListUpdates, friendRequestUpdates, friendUsername, navbarHeight, setUseHome }) {
    // Setting default options for Axios
    axios.defaults.withCredentials = true;

    // Using the useCookies hook to get cookies
    const [cookies] = useCookies();

    // Declaration of states used in the component
    const [friendList, setFriendList] = useState([]); // List of friends
    const [friendName, setFriendName] = useState(''); // Friend's name
    const [infoFriend, setInfoFriend] = useState('Friend Username'); // Friend information
    const [pendingFList, setPendingFList] = useState([]); // List of pending friend requests
    const [activeMessageId, setActiveMessageId] = useState(''); // Active message ID

    // Effect executed when friend request updates change
    useEffect(() => {
        axios
            .post(backend + '/users/logOrQuit', { exit: false }) // Request to the backend to check cookies
            .then((response) => {
                if (response.status === 200) {
                    const rawPendingFList = response.data.pendingFList;
                    const requests = rawPendingFList.map((item) =>
                        axios.post(backend + '/users/userById', { userId: item })
                    );
                    axios
                        .all(requests)
                        .then((results) => {
                            const pendingFListData = results.map((result) => result.data.username);
                            setPendingFList(pendingFListData);
                        })
                        .catch((error) => {
                            console.log(error.response.data.message);
                            setPendingFList([]);
                        });
                } else {
                    console.log('Access failed, please log in again');
                    if (cookies) {
                        // Clear all cookies
                        document.cookie = Object.keys(cookies).map(cookieKey => `${cookieKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`).join('');
                    }
                    window.location.reload();
                }
            })
            .catch((error) => {
                console.log(error.response.data.message);
                setPendingFList([]);
            });
    }, [friendRequestUpdates]);

    // Effect executed when friend list updates change
    useEffect(() => {
        if (friendUsername) {
            setActiveMessageId(friendUsername);
        }
        const fetchFriendList = async () => {
            // Request to the backend to get the list of friends
            await axios.post(backend + '/friends/friendList')
                .then((response => {
                    setFriendList(response.data);
                    // Check if the friend's username in the URL is in the list of friends and clear it if it's not
                    const containsUsername = response.data.some(
                        (object) => object.username === friendUsername
                    );
                    if (!containsUsername && friendUsername) {
                        setUseHome(true);
                    }
                }))
                .catch((error) => {
                    console.log(error.response.data.message);
                });
        };
        fetchFriendList();
    }, [friendListUpdates]);

    // Delete friend/chat
    const deleteFriendship = async (r_username) => {
        // Request to the backend to delete a friendship (along with the chat)
        await axios.post(backend + '/friends/deleteFriend', { friendUsername: r_username })
            .catch((error) => {
                console.log(error.response.data.message);
            });
    };

    // Handle friend's name input
    const handleInputChange = (e) => {
        setFriendName(e.target.value);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Request to the backend to add a friend
        await axios.post(backend + '/friends/addFriend', { friendUsername: friendName })
            .then((response) => {
                setFriendName('');
                setInfoFriend(response.data.message);
            })
            .catch((error) => {
                setFriendName('');
                setInfoFriend(error.response.data.message);
            });
    };

    // Accept a friend request
    const handleAcceptRequest = async (r_username) => {
        await axios.post(backend + '/friends/acceptRequest', { friendUsername: r_username })
            .catch((error) => {
                console.log(error.response.data.message);
            });
    };

    // Reject a friend request
    const handleDenyRequest = async (r_username) => {
        await axios.post(backend + '/friends/rejectRequest', { friendUsername: r_username })
            .catch((error) => {
                console.log(error.response.data.message);
            });
    };

    // Handle click on a friend
    const handleFriendClick = (clickedFriend) => {
        setActiveMessageId(clickedFriend.username);
    };

    return (
        <aside className="menu">
            <ul className="menu-list chat-list" style={{ maxHeight: `calc(83vh - ${navbarHeight}px)` }}>
                {/* If the list of friends is not empty, display each friend */}
                {friendList.length > 0 && (
                    friendList.map((friend) => (
                        <li key={friend.username}>
                            {/* Link to open a chat with the friend */}
                            <Link
                                className={`chat-link ${friend.username === activeMessageId ? 'is-active' : ''}`}
                                to={`/${friend.username}`}
                                onClick={() => handleFriendClick(friend)}
                            >
                                <span className="icon">
                                    <i className="fas fa-comment"></i>
                                </span>
                                <label>{friend.username}</label>
                                {/* Icon to delete friend and chat */}
                                <span
                                    className="icon is-small is-pulled-right"
                                    style={{ pointerEvents: 'auto' }}
                                    onClick={() => deleteFriendship(friend.username)}
                                >
                                    <i className={`fas fa-trash`}></i>
                                </span>
                                {/* Display the last message exchanged with the friend */}
                                {friend.lastMessage && <div className="last-message">{friend.lastMessage}</div>}
                            </Link>
                        </li>
                    ))
                )}
            </ul>
            <div className="box">
                {/* Display the list of pending friend requests */}
                <div className="scrollable-list-container">
                    <div className="scrollable-list">
                        {pendingFList.length > 0 && (
                            pendingFList.map((r_username) => (
                                <div className="bubble" key={r_username}>
                                    <span className="username">{r_username}</span>
                                    <div className="buttons">
                                        <div className="field is-grouped">
                                            {/* Buttons to accept or reject the friend request */}
                                            <div className="control">
                                                <button
                                                    className="button is-success accept-button"
                                                    onClick={() => handleAcceptRequest(r_username)}
                                                >
                                                    <i className="fas fa-check"></i>
                                                </button>
                                            </div>
                                            <div className="control">
                                                <button
                                                    className="button is-danger deny-button"
                                                    onClick={() => handleDenyRequest(r_username)}
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                {/* Form to add a friend */}
                <form onSubmit={handleSubmit}>
                    <div className="field has-addons has-addons-centered p-3">
                        <div className="control is-expanded">
                            {/* Input to enter the friend's name to add */}
                            <input
                                className="input"
                                type="text"
                                placeholder={infoFriend}
                                value={friendName}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="control">
                            {/* Button to add the friend */}
                            <button className="button is-primary" type="submit">
                                Add
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </aside>
    );
}