const User = require('../models/users.js');
const Friend = require('../models/friends.js');
const { ObjectId } = require('mongoose').Types;


// Funzione ausiliaria per verificare se due utenti sono amici
function friendshipSrc({ userId, friendId }) {
  try {
    // Cerca l'amicizia nel database
    return Friend.findOne({
      $or: [
        { $and: [{ first: new ObjectId(userId) }, { second: new ObjectId(friendId) }] },
        { $and: [{ first: new ObjectId(friendId) }, { second: new ObjectId(userId) }] }
      ]
    });
  } catch (error) {
    // Gestisce gli errori nel caso in cui si verifichi un problema durante la ricerca dell'amicizia
    console.error('Si è verificato un errore nella ricerca dell\'amicizia: ', error);
    throw new Error('Errore durante la ricerca dell\'amicizia');
  }
}

// Funzione ausiliaria per semplificare l'utilizzo del WebSocket Server (WSS)
function easyWS({ clients, data, ids, more }) {
  try {
    // Converte l'insieme di client WebSocket in un array
    const wsArray = Array.from(clients);

    // Crea un nuovo array di stringhe convertendo ogni elemento di ids in stringhe
    const stringIds = ids.map(id => id.toString());
    
    // Itera attraverso tutti i client WebSocket dell'array
    wsArray.forEach(ws => {
      // Verifica se l'ID del client WebSocket corrente è incluso nell'array degli ID convertiti in stringa
      if (stringIds.includes(ws._id.toString())) {
        // Crea il messaggio da inviare
        const message = {
          type: data,
          misc: more
        };

        // Invia il messaggio come stringa JSON al client WebSocket corrente
        ws.send(JSON.stringify(message));
      }
    });
  } catch (error) {
    // Gestisce gli errori nel caso in cui si verifichi un problema durante l'invio dei dati tramite WebSocket
    console.error('Si è verificato un errore nell\'invio dei dati tramite WebSocket: ', error);
    throw new Error('Errore durante l\'invio dei dati tramite WebSocket');
  }
}

module.exports = {

  // Funzione per aggiungere un amico a un utente
  addFriend: async (req, res) => {
    try {
      let userCookies;
      // Estrarre i dati dei cookie
      if (req.cookies.userData.username) {
        userCookies = req.cookies.userData;
      } else {
        userCookies = JSON.parse(req.cookies.userData);
      }
      const { username, _id, access_id } = userCookies;
      const password = access_id;
      const { friendUsername } = req.body; // Estrae friendUsername dalla richiesta

      try {
        // Trova e verifica l'utente corrente nel database
        const userObj = await User.findOne({ username, _id, password });
        if (!userObj) {
          return res.status(404).json({ message: 'Utente non trovato' }); // Restituisce errore se l'utente corrente non viene trovato
        }

        // Trova e verifica l'utente amico nel database
        const addedUser = await User.findOne({ username: friendUsername });
        if (!addedUser) {
          return res.status(404).json({ message: 'Utente amico non trovato' }); // Restituisce errore se l'utente amico non viene trovato
        }

        // Verifica se l'utente aggiunto è lo stesso utente corrente
        if (addedUser._id.equals(userObj._id)) {
          return res.status(401).json({ message: 'Non puoi mandarti una richiesta di amicizia da solo' }); // Restituisce errore se l'utente amico è lo stesso utente corrente
        }

        const isFriend = await friendshipSrc({ userId: userObj._id, friendId: addedUser._id });

        // Verifica se l'utente aggiunto è già un amico dell'utente corrente
        if (isFriend) {
          return res.status(401).json({ message: `L'utente ${addedUser.username} è già tuo amico` }); // Restituisce errore se l'utente amico è già un amico dell'utente corrente
        }

        // Verifica se è stata già inviata una richiesta di amicizia all'utente aggiunto
        if (addedUser.pendingFList.includes(userObj._id)) {
          return res.status(401).json({ message: `Hai già inviato una richiesta di amicizia a ${addedUser.username}` }); // Restituisce errore se è già stata inviata una richiesta di amicizia all'utente amico
        }

        //Verifica se l'utente aggiunto ha già inviato una richiesta di amicizia all'utente corrente
        if (userObj.pendingFList.includes(addedUser._id)) {
          return res.status(401).json({ message: `L'utente ${addedUser.username} ti ha già mandato una richiesta di amicizia` }); // Restituisce errore se l'utente amico ha già inviato una richiesta di amicizia all'utente corrente
        }

        // Aggiunge l'utente corrente alla lista delle richieste di amicizia pendenti dell'utente aggiunto
        addedUser.pendingFList.push(userObj._id);
        await addedUser.save();

        // Attivazione e utilizzo dei WebSocket corrispondenti all'utente amico
        easyWS({ clients: req.wss.clients, data: "friendRequest_update", ids: [addedUser._id] });

        return res.status(200).json({ message: "Richiesta di amicizia inviata correttamente" }); // Restituisce conferma di successo
      } catch (error) {
        // Gestione generale degli errori
        console.error('Si è verificato un errore nell\'invio del messaggio:', error);
        return res.status(500).json({ message: 'Errore durante l\'invio della richiesta di amicizia' }); // Restituisce errore generico se si verifica un errore durante l'invio della richiesta di amicizia
      }
    } catch (error) {
      // Gestione degli errori quando i dati utente non sono presenti nella req
      console.error('Errore durante l\'estrazione dei dati:', error);
      return res.status(500).json({ message: 'Errore durante l\'estrazione dei dati' }); // Restituisce errore generico se si verifica un errore durante l'estrazione dei dati utente
    }
  },

  // Funzione per accettare una richiesta di amicizia
  acceptRequest: async (req, res) => {
    try {
      let userCookies;
      // Estrarre i dati dei cookie
      if (req.cookies.userData.username) {
        userCookies = req.cookies.userData;
      } else {
        userCookies = JSON.parse(req.cookies.userData);
      }
      const { username, _id, access_id } = userCookies;
      const password = access_id;
      const { friendUsername } = req.body;

      try {
        // Trova e verifica l'utente corrente nel database
        const userObj = await User.findOne({ username, _id, password });
        if (!userObj) {
          return res.status(404).json({ message: 'Utente non trovato' });
        }

        // Trova e verifica l'utente amico nel database
        const friendUser = await User.findOne({ username: friendUsername });
        if (!friendUser) {
          return res.status(404).json({ message: 'Utente amico non trovato' });
        }

        // Verifica se l'utente amico è già un amico dell'utente corrente
        const isFriend = await friendshipSrc({ userId: userObj._id, friendId: friendUser._id });
        if (isFriend) {
          return res.status(401).json({ message: `L'utente ${friendUser.username} è già tuo amico` });
        }

        // Verifica se l'utente corrente ha una richiesta di amicizia pendente dall'utente amico
        if (!userObj.pendingFList.includes(friendUser._id)) {
          return res.status(401).json({ message: `Non hai una richiesta di amicizia pendente da parte di ${friendUser.username}` });
        }

        // Crea un nuovo oggetto Friend con gli id dei due utenti
        const newFriendship = new Friend({ first: userObj._id, second: friendUser._id });

        // Salva la nuova amicizia nel database
        await newFriendship.save();

        // Rimuove l'utente amico dalla lista delle richieste di amicizia pendenti dell'utente corrente
        userObj.pendingFList.pull(friendUser._id);
        await userObj.save();

        // Attivazione e utilizzo dei WebSocket corrispondenti all'utente amico e all'utente corrente
        easyWS({ clients: req.wss.clients, data: "friendRequest_update", ids: [userObj._id] });
        easyWS({ clients: req.wss.clients, data: "friendList_update", ids: [userObj._id, friendUser._id] });

        return res.status(200).json({ message: 'Richiesta di amicizia accettata correttamente' });
      } catch (error) {
        // Gestione generale degli errori
        console.error('Si è verificato un errore durante l\'accettazione della richiesta di amicizia:', error);
        return res.status(500).json({ message: 'Errore durante l\'accettazione della richiesta di amicizia' });
      }
    } catch (error) {
      // Gestione degli errori quando i dati utente non sono presenti nella req
      console.error('Errore durante l\'estrazione dei dati:', error);
      return res.status(500).json({ message: 'Errore durante l\'estrazione dei dati' });
    }
  },

  // Funzione per rifiutare una richiesta di amicizia
  rejectRequest: async (req, res) => {
    try {
      let userCookies;
      // Estrarre i dati dei cookie
      if (req.cookies.userData.username) {
        userCookies = req.cookies.userData;
      } else {
        userCookies = JSON.parse(req.cookies.userData);
      }
      const { username, _id, access_id } = userCookies;
      const password = access_id;
      const { friendUsername } = req.body;

      try {
        // Trova e verifica l'utente corrente nel database
        const userObj = await User.findOne({ username, _id, password });
        if (!userObj) {
          return res.status(404).json({ message: 'Utente non trovato' });
        }

        // Trova e verifica l'utente amico nel database
        const friendObj = await User.findOne({ username: friendUsername });
        if (!friendObj) {
          return res.status(404).json({ message: 'Utente amico non trovato' });
        }

        // Verifica se l'utente corrente ha una richiesta di amicizia pendente dall'utente amico
        if (!userObj.pendingFList.includes(friendObj._id)) {
          return res.status(401).json({ message: 'Devi prima ottenere una richiesta di amicizia da questo utente per rifiutarla' });
        }

        // Rimuove l'utente amico dalla lista delle richieste di amicizia pendenti dell'utente corrente
        userObj.pendingFList.pull(friendObj._id);
        await userObj.save();

        // Attivazione e utilizzo dei WebSocket corrispondenti all'utente corrente
        easyWS({ clients: req.wss.clients, data: "friendRequest_update", ids: [userObj._id] });

        return res.status(200).json({ message: "Richiesta di amicizia rifiutata correttamente" });
      } catch (error) {
        // Gestione generale degli errori
        console.error('Si è verificato un errore nell\'invio del messaggio:', error);
        return res.status(500).json({ message: 'Errore durante l\'invio del messaggio' });
      }
    } catch (error) {
      // Gestione degli errori quando i dati utente non sono presenti nella req
      console.error('Errore durante l\'estrazione dei dati:', error);
      return res.status(500).json({ message: 'Errore durante l\'estrazione dei dati' });
    }
  },

  // Gestisce la richiesta per ottenere la lista degli amici di un utente
  friendList: async (req, res) => {
    try {
      let userCookies;
      // Estrarre i dati dei cookie
      if (req.cookies.userData.username) {
        userCookies = req.cookies.userData;
      } else {
        userCookies = JSON.parse(req.cookies.userData);
      }
      const { username, _id, access_id } = userCookies;
      const password = access_id;

      try {
        // Trova l'utente corrente nel database
        const userObj = await User.findOne({ username, _id, password });
        if (!userObj) {
          return res.status(401).json({ message: 'Utente non trovato' });
        }

        // Trova gli utenti aggiunti come amici dall'utente corrente
        const addedUsers = await Friend.find({ $or: [{ first: userObj._id }, { second: userObj._id }] });

        // Costruisci un array di oggetti amico contenenti ID, username, ultimo messaggio e data
        const friendsArray = await Promise.all(addedUsers.map(async (friend) => {
          const { first, second, chat } = friend;
          const friendId = (userObj._id.equals(first)) ? second : first;
          const friendObj = await User.findOne({ _id: friendId });
          const senderObj = await User.findOne({ _id: chat[chat.length - 1]?.from });

          return {
            id: friendId,
            username: friendObj.username,
            lastMessage: chat.length > 0 && (senderObj.username + ": " + chat[chat.length - 1]?.content),
            date: chat.length > 0 ? chat[chat.length - 1]?.date : new Date("1970-01-01T00:00:00.000Z")
          };
        }));

        // Ordina gli amici per data decrescente
        friendsArray.sort((a, b) => b.date - a.date);

        return res.status(200).json(friendsArray);
      } catch (error) {
        // Gestione generale degli errori
        console.error('Si è verificato un errore nella comunicazione con il server:', error);
        return res.status(500).json({ message: 'Errore durante il recupero della lista amici' });
      }
    } catch (error) {
      // Gestione degli errori quando i dati utente non sono presenti nei cookie
      console.error('Errore durante l\'importazione dei dati dal cookie:', error);
      return res.status(500).json({ message: 'Errore durante l\'importazione dei dati dal cookie' });
    }
  },

  // Gestisce la richiesta per eliminare una amicizia, con relativa chat
  deleteFriend: async (req, res) => {
    try {
      let userCookies;
      // Estrarre i dati dei cookie
      if (req.cookies.userData.username) {
        userCookies = req.cookies.userData;
      } else {
        userCookies = JSON.parse(req.cookies.userData);
      }
      const { username, _id, access_id } = userCookies;
      const password = access_id;
      const { friendUsername } = req.body;

      try {
        // Trova e verifica l'utente corrente nel database
        const userObj = await User.findOne({ username, _id, password });
        if (!userObj) {
          return res.status(404).json({ message: 'Utente non trovato' });
        }

        // Trova e verifica l'utente amico nel database
        const addedUser = await User.findOne({ username: friendUsername });
        if (!addedUser) {
          return res.status(404).json({ message: 'Utente amico non trovato' });
        }

        // Cerca l'amicizia tra l'utente corrente e l'utente amico 
        const friendship = await friendshipSrc({ userId: userObj._id, friendId: addedUser._id });
        if (!friendship) {
          return res.status(404).json({ message: 'Amicizia non trovata' });
        } else {
          // Elimina l'amicizia appena trovata
          await Friend.deleteOne(friendship);
          // Attivazione e utilizzo dei WebSocket corrispondenti all'utente amico e all'utente corrente
          easyWS({ clients: req.wss.clients, data: "friendList_update", ids: [addedUser._id, userObj._id] });
          easyWS({ clients: req.wss.clients, data: "chat_update", ids: [addedUser._id, userObj._id], more: [addedUser.username, userObj.username] });
          return res.status(200).json({ message: 'Amicizia eliminata con successo, insieme alla relativa chat :(' });
        }
      } catch (error) {
        // Gestione generale degli errori
        console.error('Si è verificato un errore nella eliminazione dell\'amicizia:', error);
        return res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'amicizia' });
      }
    } catch (error) {
      // Gestione degli errori quando i dati utente non sono presenti nella req
      console.error('Errore durante l\'estrazione dei dati:', error);
      return res.status(500).json({ message: 'Errore durante l\'estrazione dei dati' });
    }
  },

  // Gestisce la richiesta per ottenere la chat tra l'utente corrente e un amico specifico
  chatHandler: async (req, res) => {
    try {
      let userCookies;
      // Estrarre i dati dei cookie
      if (req.cookies.userData.username) {
        userCookies = req.cookies.userData;
      } else {
        userCookies = JSON.parse(req.cookies.userData);
      }
      const { username, _id, access_id } = userCookies;
      const password = access_id;
      const { friendUsername } = req.body;

      try {
        // Controlla se l'utente si trova nella home, e in tal caso restituisce un array vuoto
        if (friendUsername === "" || !friendUsername) {
          res.status(200).json([]);
        } else {
          // Trova e verifica l'utente corrente nel database
          const userObj = await User.findOne({ username, _id, password });
          if (!userObj) {
            return res.status(404).json({ message: 'Utente non trovato' });
          }

          // Trova e verifica l'utente amico nel database
          const addedUser = await User.findOne({ username: friendUsername });
          if (!addedUser) {
            return res.status(404).json({ message: 'Utente amico non trovato' });
          }

          // Cerca l'amicizia tra l'utente corrente e l'utente amico 
          const friendship = await friendshipSrc({ userId: userObj._id, friendId: addedUser._id });
          if (!friendship) {
            return res.status(404).json({ message: 'Amicizia non trovata' });
          } else {
            return res.status(200).json(friendship.chat);
          }
        }
      } catch (error) {
        // Gestione generale degli errori
        console.error('Si è verificato un errore nel caricamento della chat:', error);
        return res.status(500).json({ message: 'Errore durante il caricamento della chat' });
      }
    } catch (error) {
      // Gestione degli errori quando i dati utente non sono presenti nella req
      console.error('Errore durante l\'estrazione dei dati:', error);
      return res.status(500).json({ message: 'Errore durante l\'estrazione dei dati' });
    }
  },

  // Gestisce la richiesta per inviare un messaggio a un amico specifico
  messageSubmit: async (req, res) => {
    try {
      let userCookies;
      // Estrarre i dati dei cookie
      if (req.cookies.userData.username) {
        userCookies = req.cookies.userData;
      } else {
        userCookies = JSON.parse(req.cookies.userData);
      }
      const { username, _id, access_id } = userCookies;
      const password = access_id;
      const { friendUsername, message } = req.body;
      try {
        // Trova e verifica l'utente corrente nel database
        const userObj = await User.findOne({ username, _id, password });
        if (!userObj) {
          return res.status(404).json({ message: 'Utente non trovato' });
        }

        // Trova e verifica l'utente amico nel database
        const addedUser = await User.findOne({ username: friendUsername });
        if (!addedUser) {
          return res.status(404).json({ message: 'Utente amico non trovato' });
        }

        // Cerca l'amicizia tra l'utente corrente e l'utente amico 
        const friendship = await friendshipSrc({ userId: userObj._id, friendId: addedUser._id });
        if (!friendship) {
          return res.status(404).json({ message: 'Amicizia non trovata' });
        }

        // Verifica se il messaggio è vuoto
        if (message.trim().length === 0) {
          return res.status(400).json({ message: 'Messaggio vuoto' });
        }

        // Aggiungi il messaggio alla chat dell'amicizia
        friendship.chat.push({
          from: userObj._id,
          content: message,
          date: new Date()
        });
        await friendship.save();

        // Attivazione e utilizzo dei WebSocket corrispondenti all'utente corrente e all'utente amico
        easyWS({ clients: req.wss.clients, data: "chat_update", ids: [addedUser._id, userObj._id], more: [addedUser.username, userObj.username] });
        easyWS({ clients: req.wss.clients, data: "friendList_update", ids: [addedUser._id, userObj._id] });

        return res.status(200).json({ message: "Messaggio inviato correttamente" });
      } catch (error) {
        // Gestione generale degli errori
        console.error('Si è verificato un errore nell\'invio del messaggio:', error);
        return res.status(500).json({ message: 'Errore durante l\'invio del messaggio' });
      }
    } catch (error) {
      // Gestione degli errori quando i dati utente non sono presenti nella req
      console.error('Errore durante l\'estrazione dei dati: ', error);
      return res.status(500).json({ message: 'Errore durante l\'estrazione dei dati' });
    }
  }

};