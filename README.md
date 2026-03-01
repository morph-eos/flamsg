# FlaMSG

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-blueviolet.svg)
![University Project](https://img.shields.io/badge/Type-University%20Project-green.svg)

## Overview

FlaMSG is a full-stack chat web application built with the MERN stack (MongoDB, Express, React, Node.js), developed as a university project at **Politecnico di Bari**. It features real-time messaging via WebSocket, a friend request system, persistent chat history, and responsive design.

A live demo is available at [flamsg.onrender.com](https://flamsg.onrender.com) (free tier hosting, initial load may take 30-60 seconds).

## Architecture

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 18 + Vite | Single-page application with hooks-based state management |
| **Backend** | Node.js + Express | REST API and static file serving |
| **Database** | MongoDB + Mongoose | User data, friend lists, and message persistence |
| **Real-time** | WebSocket (ws) | Bidirectional messaging between connected clients |
| **Security** | bcryptjs + Helmet | Password hashing and HTTP security headers |
| **Styling** | Bulma CSS | Responsive layout for desktop and mobile |

## Project Structure

```
├── index.js              # Express server and WebSocket setup
├── package.json
├── _frontend/            # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx       # Root component and routing
│   │   ├── Main.jsx      # Chat interface
│   │   ├── Start.jsx     # Login and registration
│   │   └── panels/       # Chat UI components
│   └── package.json
├── controllers/          # Business logic
│   ├── users.js          # Authentication and user management
│   └── friends.js        # Friend requests and list management
├── models/               # Mongoose schemas
│   ├── users.js
│   └── friends.js
├── routes/               # Express route definitions
│   ├── users.js
│   └── friends.js
├── .env.example
├── LICENSE
└── CHANGELOG.md
```

## Getting Started

### Prerequisites

- Node.js 16+
- MongoDB instance (local or Atlas)

### Setup

```bash
# Clone and install
git clone https://github.com/M04ph3u2/FlaMSG.git
cd FlaMSG
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and port

# Build frontend and start server
npm run build-all
npm run start-server
```

The application will be available at `http://localhost:3000`.

## Security Disclaimer

This project was developed for educational purposes and is **not intended for production use**. Passwords are properly hashed with bcryptjs, but the application lacks end-to-end encryption, JWT-based authentication, rate limiting, and data protection compliance.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

Developed as coursework at **Politecnico di Bari** under the guidance of **Prof. Antonio Ferrara** for the full-stack web development curriculum (2023).
