const User = require('../models/users.js');
const bcrypt = require('bcryptjs');

module.exports = {

  // Funzione per la registrazione di un nuovo utente
  register: async (req, res) => {
    try {
      const { username, password } = req.body; // Estrae l'username e la password dalla richiesta

      try {
        const existingUser = await User.findOne({ username }); // Cerca un utente nel database con lo stesso username

        if (existingUser) {
          // Se l'utente esiste già, restituisce un errore 400 con un messaggio appropriato
          return res.status(400).json({ message: "L'utente che si sta tentando di registrare esiste già" });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Esegue l'hashing della password

        const newUser = new User({ username, password: hashedPassword }); // Crea un nuovo oggetto User con l'username e la password hashata

        await newUser.save(); // Salva il nuovo utente nel database

        // Restituisce una risposta di successo con un messaggio appropriato
        return res.status(200).json({ message: 'Registrazione avvenuta con successo. Puoi ora eseguire l\'accesso cliccando sul pulsante apposito.' });
      } catch (error) {
        console.error('Errore durante la registrazione:', error);
        // Se si verifica un errore durante la registrazione, restituisce un errore 500 con un messaggio appropriato
        return res.status(500).json({ message: 'Errore durante la registrazione' });
      }
    } catch (error) {
      console.error('Errore durante l\'estrazione dei dati dal body:', error);
      // In caso di errore, restituisci un errore 500
      return res.status(500).json({ message: 'Errore durante l\'estrazione dei dati dal body' });
    }
  },

  // Funzione per l'accesso di un utente esistente
  login: async (req, res) => {
    try {
      // Ottieni i dati dalla richiesta HTTP
      const { username, password, rememberMe } = req.body;

      try {
        // Cerca un utente nel database con l'username fornito
        const user = await User.findOne({ username });

        // Se l'utente non esiste, restituisci un errore 401
        if (!user) {
          return res.status(401).json({ message: 'Non esiste alcun utente con questo username' });
        }

        // Confronta la password fornita con la password dell'utente nel database
        const isMatch = await user.comparePassword(password);

        // Se le password non corrispondono, restituisci un errore 401
        if (!isMatch) {
          return res.status(401).json({ message: 'Password errata' });
        }

        // Imposta la durata massima del cookie in base alla scelta di rememberMe
        const maxAge = rememberMe ? 365 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;

        // Crea un oggetto con i dati del cookie da salvare
        const cookieData = {
          username: user.username,
          _id: user._id,
          access_id: user.password
        };

        // Opzioni del cookie
        const cookieOptions = {
          maxAge,
          sameSite: 'lax'
        };

        // Imposta il cookie nell'header della risposta
        res.cookie('userData', cookieData, cookieOptions);

        // Restituisci un messaggio di successo
		return res.status(200).json({ message: 'Accesso riuscito' });
		
      } catch (error) {
        console.error('Errore durante il login:', error);

        // In caso di errore, restituisci un errore 500
        return res.status(500).json({ message: 'Errore durante il login' });
      }
    } catch (error) {
      console.error('Errore durante l\'estrazione dei dati dal body:', error);
      // In caso di errore, restituisci un errore 500
      return res.status(500).json({ message: 'Errore durante l\'estrazione dei dati dal body' });
    }
  },

  // Funzione per ottenere le informazioni di un utente dato il suo ID
  userById: async (req, res) => {
    try {
      // Estrapolazione dell'ID dell'utente dalla richiesta
      const { userId } = req.body;

      try {
        // Ricerca dell'utente nel database utilizzando l'ID
        const user = await User.findOne({ _id: userId });

        if (!user) {
          // Se l'utente non viene trovato, restituisci una risposta con uno stato 404 (non trovato)
          return res.status(404).json({ message: 'Utente non trovato' });
        }

        // Se l'utente viene trovato, restituisci una risposta con uno stato 200 (OK) e le informazioni dell'utente
        return res.status(200).json({ username: user.username });
      } catch (error) {
        // In caso di errore durante la ricerca dell'utente, gestisci l'errore e restituisci una risposta con uno stato 500 (errore del server)
        console.error('Errore durante la ricerca dell\'utente:', error);
        return res.status(500).json({ message: 'Errore durante la ricerca dell\'utente' });
      }
    } catch (error) {
      // Gestione degli errori durante l'estrazione dell'ID dell'utente dalla richiesta
      console.error('Errore durante l\'estrazione dell\'ID dell\'utente:', error);
      return res.status(500).json({ message: 'Errore durante l\'estrazione dell\'ID dell\'utente' });
    }
  },

  // Funzione per controllare la correttezza dei cookie e/o eliminare l'userEventEmitter e svuotare i cookie dell'utente
  logOrQuit: async (req, res) => {
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
        
        // Estrazione e controllo della modalitá di utilizzo di logOrQuit
        const { exit } = req.body;

        if (!exit) {
          // Verificare la presenza dell'utente nel database
          const userObj = await User.findOne({ username, _id, password });

          if (userObj) {
            // Restituire una risposta positiva se l'utente è stato trovato nel database
            return res.status(200).json({ message: 'Cookie verificati', pendingFList: userObj.pendingFList });
          }
        }
      } catch (error) {
        // Gestione degli errori nel controllo dei dati
        console.error('Errore durante il controllo dei dati:', error);
      }
    } catch (error) {
      // Gestione degli errori quando i dati utente non sono presenti nei cookie
      console.error('Errore durante l\'importazione dei dati dal cookie:', error);
    }

    // Se non ha trovato l'utente nei cookie, c'è stato un errore durante il controllo o la funzione è stata richiamata per il logout
    // Eliminare tutti i dati utente dai cookie
    try {
      // Rimuovi il client WebSocket corrispondente all'utente
      req.wss.clients.forEach((client) => {
        if (client.userData && client.userData._id === _id) {
          client.terminate(); // Chiudi la connessione WebSocket
        }
      });

      // Svuota i cookie dell'utente
      res.clearCookie('userData');

      // Imposta un cookie con valore vuoto e data di scadenza passata per eliminarlo nel client
      res.cookie('userData', '', { expires: new Date(0) });

      // Restituisci una risposta positiva per confermare l'uscita
      return res.status(200).json({ message: 'Uscita effettuata con successo' });
    } catch (error) {
      // Gestione degli errori durante l'uscita
      console.error('Errore durante l\'uscita:', error);
      return res.status(500).json({ message: 'Errore durante l\'uscita' });
    }
  }
    
};