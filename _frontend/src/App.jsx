import React, { useState, useEffect } from 'react';
import Start from './Start';
import Main from './Main';
import icon from './icon.png';
import './custom.css';
import { useCookies } from 'react-cookie'; // Hook that allows reading, writing, and removing cookies in a React component
import { Routes, Route } from 'react-router-dom';
import loadingif from './loading.gif';

export default function App() {
    // Instance of useCookies() used for various operations
    const [cookies] = useCookies();
    // States related to the connection with the Backend
    // Note: Just like this simple check that allows you to determine the environment, there are numerous checks in the code that enable running the same code both locally (e.g., with WebStorm) and online through Render
    const [backend, setBackend] = useState('');

    // Check regarding whether the program is running locally or on the internet via Render
    useEffect(() => {
        if (window.location.origin.includes('localhost')) {
            setBackend('http://localhost:3000');
            console.log('Running on Localhost');
        } else {
            setBackend('https://flamsg.onrender.com');
            console.log('Running on Render');
        }
    }, []);

    return (
        <div className="App">
            {/* Check if a userData object exists in the cookies */}
            {backend ? (
                cookies.userData ? (
                    <Routes>
                        <Route path="/" element={<Main icon={icon} backend={backend} loadingif={loadingif} />} />
                        <Route path=":friendUsername" element={<Main icon={icon} backend={backend} loadingif={loadingif} />} />
                    </Routes>
                ) : (
                    <Start icon={icon} backend={backend} />
                )
            ) : (
                {/* If the backend hasn't loaded yet, display the loading gif */ }
                < div className="container">
            <div className="columns is-centered">
                <div className="column is-half">
                    <div className="is-flex is-flex-direction-column is-align-items-center is-justify-content-center" style={{ height: '100vh' }}>
                        <figure className="image has-text-centered">
                            <img src={loadingif} alt="Loading Gif" />
                        </figure>
                        <p className="has-text-primary is-size-4 mt-3 has-text-weight-semibold">Loading...</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
    </div >
  );
}