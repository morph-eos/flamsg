import React, { useState, useEffect, useRef } from 'react';
import Chats from './panels/Chats';
import ChatBox from './panels/ChatBox';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import { useParams } from 'react-router-dom';

export default function Main({ icon, backend, loadingif }) {
  // Ottieni il parametro friendUsername dall'URL
  const { friendUsername } = useParams();

  // Utilizza il pacchetto react-cookie per gestire i cookie
  const [cookies] = useCookies();

  // Stati utilizzati per gestire l'altezza della navbar, gli aggiornamenti della chat e altre variabili di stato
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [chatUpdates, setChatUpdates] = useState({ index: 0, usrs: [] });
  const [friendListUpdates, setFriendListUpdates] = useState(0);
  const [friendRequestUpdates, setFriendRequestUpdates] = useState(0);
  const [showAside, setShowAside] = useState(false);
  const [oldUsername] = useState(friendUsername);
  const [useHome, setUseHome] = useState(false);

  // Utilizza il riferimento useRef per ottenere l'altezza della navbar
  const navbarRef = useRef(null);

  // Stato per gestire la larghezza della schermata
  const [screenWidth, setScreenWidth] = useState(
    window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
  );

  // Imposta la configurazione di default per le richieste Axios
  axios.defaults.withCredentials = true;

  // Primo controllo e utilizzo del controllo per la pulizia del ChatBox
  useEffect(() => {
    if (!friendUsername) {
      setUseHome(true);
      // Modifica il titolo della pagina utilizzando l'oggetto document.title nel caso di Homepage
      document.title = document.title.split(' ')[0] + ' - Homepage';
    } else {
      setUseHome(false);
      // Modifica il titolo della pagina utilizzando l'oggetto document.title nel caso di chat con un utente
      document.title = document.title.split(' ')[0] + ' -> ' + friendUsername;
    }
  }, [friendUsername]);

  useEffect(() => {
    // Calcola l'altezza della navbar dopo aver ottenuto il riferimento
    if (navbarRef.current) {
      setNavbarHeight(navbarRef.current.offsetHeight);
    }

    // Aggiungi un ascoltatore per l'evento di ridimensionamento della finestra
    const handleResize = () => {
      if (navbarRef.current) {
        setNavbarHeight(navbarRef.current.offsetHeight);
      }
      setScreenWidth(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
    };
    window.addEventListener('resize', handleResize);
    //Imposta che, se lo schermo é abbastanza piccolo da rendere utilizzabile showAside, non é stata selezionata alcuna chat e l'aside non é visualizzato, di visualizzarlo forzatamente
    if (screenWidth < 1024 && useHome && !showAside) {
      setShowAside(!showAside);
    }

    // Rimuovi l'ascoltatore quando il componente viene smontato
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [useHome]);

  useEffect(() => {
    //Permette di nascondere automaticamente la lista chat ogni volta che si clicca su di una nuova
    if (friendUsername !== oldUsername) {
      setShowAside(!showAside);
    }
  }, [friendUsername])

  useEffect(() => {
    // Funzione per gestire gli aggiornamenti WebSocket
    const handleUpdate = (event) => {
      const message = JSON.parse(event.data);

      // Gestisci l'aggiornamento in base al tipo di messaggio
      if (message.type === 'friendRequest_update') {
        setFriendRequestUpdates((prevUpdates) => prevUpdates + 1);
      }
      if (message.type === 'friendList_update') {
        setFriendListUpdates((prevUpdates) => prevUpdates + 1);
      }
      if (message.type === 'chat_update') {
        setChatUpdates((prevUpdates) => ({
          index: prevUpdates.index + 1,
          usrs: message.misc
        }));
      }
    };

    // Crea una nuova istanza WebSocket utilizzando e a seconda del backend specificato
    let ws;
    if (backend.includes('localhost')) {
      ws = new WebSocket('ws://' + backend.replace(/^(http?:\/\/)?/i, ""));
    } else {
      ws = new WebSocket('wss://' + backend.replace(/^(https?:\/\/)?/i, ""));
    }

    // Gestisci gli eventi in arrivo dal WebSocket
    ws.onmessage = (event) => handleUpdate(event);

    // Chiudi il WebSocket quando il componente viene smontato
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="columns is-gapless is-multiline">
      {/* Blocco superiore */}
      <div className="column is-full">
        <nav className="navbar is-dark is-fixed-top" role="navigation" aria-label="main navigation" ref={navbarRef}>
          <div className="navbar-brand">
            <img src={icon} alt="Icona" className="icon" />
            <h1 className="navbar-item is-size-4">FlaMSG</h1>
          </div>
          <div className="navbar-end">
            {/* Pulsante per mostrare/nascondere il pannello laterale */}
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
            <div className="navbar-item has-text-white">Benvenutə {cookies.userData.username}</div>
          </div>
          <div className="navbar-end">
            {/* Pulsante per l'uscita dall'applicazione */}
            <div className="navbar-item">
              <button className="button is-dark" onClick={() => {
                // Richiesta per il logout
                axios.post(backend + '/users/logOrQuit', { exit: true })
                  .catch((error) => {
                    console.log(error);
                  });
                if (cookies) {
                  // Elimina tutti i cookie
                  document.cookie = Object.keys(cookies).map(cookieKey => `${cookieKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`).join('');
                }
                const rootUrl = window.location.origin; // Ottieni l'URL radice del tuo sito
                window.location.href = rootUrl; // Naviga alla route radice, ricaricando senza mantenere alcun username nello URL
              }}>Esci</button>
            </div>
          </div>
        </nav>
      </div>
      {/* Blocco sotto la navbar */}
      <div className="column is-full" style={{ marginTop: navbarHeight }}>
        <div className="columns is-gapless">
          {/* Pannello principale */}
          <div className={`column ${showAside ? (screenWidth < 769 ? 'is-hidden' : 'is-three-quarters') : (screenWidth >= 1024 ? 'is-three-quarters' : 'is-full')}`}>
            <ChatBox backend={backend} chatUpdates={chatUpdates} friendUsername={friendUsername} navbarHeight={navbarHeight} loadingif={loadingif} useHome={useHome} />
          </div>
          {/* Pannello laterale sinistro */}
          <div className={`column ${screenWidth < 1024 ? (showAside ? 'is-one-quarter' : 'is-hidden') : 'is-one-quarter'}`} style={{ maxHeight: `calc(100vh - ${navbarHeight}px)` }}>
            <Chats backend={backend} friendListUpdates={friendListUpdates} friendRequestUpdates={friendRequestUpdates} friendUsername={friendUsername} navbarHeight={navbarHeight} setUseHome={setUseHome} />
          </div>
        </div>
      </div>
    </div>
  );

};