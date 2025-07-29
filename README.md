# FlaMSG - FullStack MERN Chat Web App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-green.svg)](https://www.mongodb.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

FlaMSG is a FullStack MERN (MongoDB, Express, React, Node.js) chat web application developed as a university project at **Politecnico di Bari**. It provides a simple and functional chat platform for users to engage in real-time conversations with friend requests, chat history, and responsive design.

<p align="center">
  <a href="https://flamsg.onrender.com/">
    <img src="./_frontend/src/icon.png" width="300px" alt="FlaMSG Preview">
  </a>
  <br>
  <i>Click the image to visit FlaMSG (Live Demo)</i>
</p>

## 📋 Table of Contents

- [Features](#-features)
- [Live Demo](#-live-demo)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#️-environment-variables)
- [Usage](#-usage)  
- [License](#-license)
- [Project History](#-project-history)

## ✨ Features

- **User Authentication**: Users can create accounts and log in securely with password hashing (bcrypt).
- **Friend System**: Send friend requests, accept/reject requests, and manage your friend list.
- **Real-Time Chat**: Engage in real-time, two-way communication with other users via WebSocket.
- **Message History**: View chat history and previous messages stored in MongoDB.
- **Responsive Design**: Works seamlessly on both desktop and mobile devices using Bulma CSS.

## 🌐 Live Demo

### Try the Live Demo

This implementation features a fully functional live demo showcasing the complete MERN chat platform capabilities. The demo provides a comprehensive demonstration of the real-time messaging system, friend management, and user authentication features developed as part of the university project at Politecnico di Bari.

**Demo URL**: [https://flamsg.onrender.com](https://flamsg.onrender.com)

**Note**: The demo runs on a free hosting tier, so initial loading may take 30-60 seconds as the server spins up from sleep mode.

## 🚀 Tech Stack

### Frontend

- React 18 with Hooks
- Vite for build system
- CSS3 for styling
- WebSocket for real-time communication

### Backend

- Node.js & Express.js
- MongoDB with Mongoose ODM
- Socket.io for WebSocket implementation
- bcryptjs for password hashing
- CORS and Helmet for security

## 📁 Project Structure

```plaintext
FlaMSG/
├── index.js                 # Main server file
├── package.json             # Backend dependencies
├── _frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main app component
│   │   ├── Main.jsx        # Chat interface
│   │   ├── Start.jsx       # Login/signup page
│   │   └── panels/         # Chat components
│   └── package.json        # Frontend dependencies
├── controllers/             # Business logic
│   ├── users.js            # User authentication
│   └── friends.js          # Friend management
├── models/                  # Database schemas
│   ├── users.js            # User model
│   └── friends.js          # Friend model
└── routes/                  # API endpoints
    ├── users.js            # User routes
    └── friends.js          # Friend routes
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database (local or cloud)
- npm or yarn

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/M04ph3u2/FlaMSG.git
cd FlaMSG

# Install backend dependencies
npm install

# Set up environment variables (see below)
# Create a .env file in the root directory

# Start the backend server
npm run start-server
```

### Frontend Setup

```bash
# Install frontend dependencies
npm run install-frontend

# Build the frontend
npm run build-frontend

# For development, you can run both simultaneously
npm run build-all
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/flamsg
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/flamsg

PORT=3000
```

**Important**: Never commit your `.env` file to version control. The `.gitignore` already excludes it.

## 🎯 Usage

1. **Start the application**: Run `npm run start-server` after setting up the environment variables
2. **Register an account**: Create a new user account on the login page
3. **Add friends**: Search for other users by username and send friend requests
4. **Start chatting**: Accept friend requests and start real-time conversations

## 🔒 Security Notes

**⚠️ Educational Project Disclaimer:**

This project was created for educational purposes at Politecnico di Bari and is **not intended for production use**.

**Known Limitations:**

- Messages are not encrypted end-to-end
- Basic cookie-based authentication (educational implementation)
- No privacy policy or data protection compliance
- Limited input validation and rate limiting

**What's Secure:**

- Passwords are properly hashed using bcryptjs
- MongoDB URI is stored in environment variables
- CORS and Helmet.js provide basic security headers
- No sensitive data is committed to version control

**Recommendation**: Use this project as a learning reference. For production applications, implement proper JWT authentication, input validation, rate limiting, and encryption.

## 📄 License

This project is open-source and available under the MIT License.

## 📈 Project History

### 📅 Development Timeline

**June-July 2023** - Initial Development Period

- Project developed as university coursework at Politecnico di Bari
- Full-stack MERN implementation with real-time chat features
- WebSocket integration for live messaging
- Friend request system and chat functionality
- Original development completed during summer semester

**November 8, 2023** - GitHub Upload & Organization

- Project uploaded to GitHub from local development environment
- Repository structure organized and .gitignore configured
- Migration from Replit to Render hosting platform
- Bug fixes and translation improvements
- All development history compressed into single upload date

**March 4, 2024** - Final Updates & Archive

- Final README updates and documentation improvements
- Project submitted as completed coursework
- Repository archived after academic submission
- Live deployment maintained on Render platform

**July 21, 2025** - Documentation Revival

- Repository un-archived for portfolio purposes
- Comprehensive documentation overhaul
- Added detailed setup instructions and project structure
- Enhanced security notes and development context
- Professional README for portfolio presentation

### 🎓 Academic Context

This project was developed as part of the curriculum at **Politecnico di Bari** during the 2023 academic year, focusing on full-stack web development using the MERN stack with real-time communication features.

## 🙏 Acknowledgments

Special thanks to my university **"Politecnico di Bari"** and **Prof. Antonio Ferrara** for the guidelines on the MERN Fullstack development.

---

*Enjoy using FlaMSG! Feel free to reach out with any questions or feedback.*
