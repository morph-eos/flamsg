const express = require('express');
const app = express(); // Creazione di un'istanza dell'applicazione Express
const cors = require('cors'); // Middleware per la gestione delle richieste CORS (Cross-Origin Resource Sharing)
const cookieParser = require('cookie-parser'); // Middleware per il parsing dei cookie delle richieste HTTP
const helmet = require('helmet'); // Middleware per la sicurezza delle applicazioni Express
const WebSocket = require('ws'); // Libreria per la creazione di server WebSocket
const path = require('path');
const mongoURI = process.env.MONGODB_URI;

//Creazione dell'istanza di WebSocket.Server
const wss = new WebSocket.Server({ noServer: true });

// Configurazione di base di cors
app.use(cors({
  origin: ['https://flamsg.onrender.com/', 'http://localhost:5173'],
  credentials: true
}));

// Configurazione dei middleware
app.use(cookieParser());
app.use(express.json());
app.use(helmet());

// Servi i file statici nella directory "dist" (assumendo che sia stata creata dalla build di Vite)
app.use(express.static(path.join(__dirname, './_frontend/dist')));

// Middleware per rendere l'istanza di WebSocket.Server globale
app.use((req, res, next) => {
  req.wss = wss; // Aggiungi l'istanza di WebSocket.Server all'oggetto req
  next();
});

// Connessione al database MongoDB
const mongoose = require('mongoose');
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.once("open", () => console.log("Connessione al DB eseguita con successo"));

// Importa i router per le diverse risorse
const usersRouter = require('./routes/users.js');
const friendsRouter = require('./routes/friends.js');

app.get('/', (req, res) => {
  res.send("Benvenuto!");
});

// Route per le operazioni sugli utenti
app.use('/users', usersRouter);

// Route per le operazioni sugli amici
app.use('/friends', friendsRouter);

// Setup del server
const server = app.listen(3000, () => {
  console.log("App in ascolto sulla porta 3000");
});

// Collegamento del server WebSocket al server HTTP
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    // Ottieni la stringa dei cookie dal campo "cookie" dell'header della richiesta
    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      // Parse dei cookie utilizzando il modulo "cookie"
      const cookie = require('cookie');
      const cookies = cookie.parse(cookieHeader);
      // Per risolvere alcuni degli errori di implementazione c'é bisogno di questo controllo
      if (cookies.userData) {
        let userData;
        if (cookies.userData.startsWith("j")) {
          userData = JSON.parse(cookies.userData.substring(2));
        } else {
          userData = JSON.parse(cookies.userData);
        }
        const userId = userData._id;
        // Aggiungi l'ID utente come proprietà personalizzata al client WebSocket
        ws._id = userId;
      }
    }
    wss.emit('connection', ws, request);
  });
});

// Gestione degli errori WebSocket
wss.on('error', (error) => {
  console.error('Errore WebSocket:', error);
});