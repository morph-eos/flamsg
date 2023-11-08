import React, { useState } from 'react';
import axios from 'axios';
import { useCookies } from 'react-cookie';

export default function Start({ icon, backend }) {
    // States for information, username, password, "Remember Me" checkbox, and password visibility
    const [info, setInfo] = useState('Log in to your account or create a new one');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [cookies] = useCookies();
    axios.defaults.withCredentials = true;

    // Handler for changing the username
    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    // Handler for changing the password
    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    };

    // Handler for changing the "Remember Me" checkbox value
    const handleRememberMeChange = (event) => {
        setRememberMe(event.target.checked);
    };

    // Function to show/hide the password
    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    // Handler for login
    const handleLogin = async (event) => {
        event.preventDefault();
        axios
            .post(backend + '/users/login', { username, password, rememberMe })
            .then((response) => {
                if (response.status === 200) {
                    setInfo(response.data.message);
                    setTimeout(function () {
                        window.location.reload(false); // Reloads the current page
                    }, 900);
                }
            })
            .catch((error) => {
                setInfo(error.response.data.message);
            });
    };

    // Handler for registration
    const handleRegistration = async (event) => {
        event.preventDefault();
        axios
            .post(backend + '/users/register', { username, password })
            .then((response) => {
                setInfo(response.data.message);
            })
            .catch((error) => {
                setInfo(error.response.data.message);
            });
    };

    return (
        <div className="hero is-fullheight">
            <div className="hero-body">
                <div className="container">
                    {/* Header */}
                    <div className="has-text-centered">
                        <div className="is-flex is-flex-direction-column is-align-items-center is-justify-content-center">
                            <img src={icon} alt="Icon" className="bigicon" />
                            <h1 className="title is-1">FlaMSG</h1>
                        </div>
                        <h2 className="subtitle is-4 mt-5">{info}</h2>
                    </div>

                    {/* Login Form */}
                    <div className="columns is-centered mt-5">
                        <div className="column is-half">
                            <form onSubmit={handleLogin}>
                                {/* "Username" Field */}
                                <div className="field">
                                    <label className="label">Username</label>
                                    <div className="control">
                                        <input
                                            className="input"
                                            type="username"
                                            placeholder="Enter your username"
                                            value={username}
                                            onChange={handleUsernameChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* "Password" Field */}
                                <div className="field">
                                    <label className="label">Password</label>
                                    <div className="control has-icons-right">
                                        <input
                                            className="input"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                        {/* Icon to show/hide the password */}
                                        <span className="icon is-small is-right" style={{ pointerEvents: 'auto' }} onClick={toggleShowPassword}>
                                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </span>
                                    </div>
                                </div>

                                {/* "Remember Me" Checkbox */}
                                <div className="field">
                                    <div className="control">
                                        <label className="checkbox">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={handleRememberMeChange}
                                            />
                                            <span className="ml-1 checkmark"></span>
                                            Remember Me
                                        </label>
                                    </div>
                                </div>

                                {/* "Login" and "Register" Buttons */}
                                <div className="field is-grouped">
                                    <div className="control">
                                        <button className="button is-link" onClick={handleLogin}>
                                            Log In
                                        </button>
                                    </div>
                                    <div className="control">
                                        <button className="button is-primary is-light" onClick={handleRegistration}>
                                            Register
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    {/* Information about the project's nature and security */}
                    <div className="has-text-centered mt-5">
                        <p className="is-size-6">
                            <strong>Note:</strong> This project is for educational purposes and is not intended for production use. Messages are not encrypted, and there is no privacy policy. Please be cautious when sharing sensitive information. Only passwords are encrypted for security reasons. This site uses a single cookie to maintain the login session, with 0 external cookies.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}