import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useCookies } from 'react-cookie';

export default function ChatBox({ backend, chatUpdates, friendUsername, navbarHeight, loadingif, useHome }) {
  // Impostazione di axios per l'utilizzo dei cookie
  axios.defaults.withCredentials = true;

  // Utilizzo del hook useCookies per ottenere i cookie
  const [cookies] = useCookies();

  // Stati per il contenuto del messaggio, le informazioni sul messaggio, la chat e lo stato di caricamento
  const [msgContent, setMsgContent] = useState('');
  const [msgInfo, setMsgInfo] = useState('Scrivi un messaggio');
  const [chat, setChat] = useState([]);
  const [loadingChat, setLoadingChat] = useState(true);

  // Opzioni per la formattazione della data
  const dateOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: "Europe/Rome"
  };

  // Referenza per l'elemento della chat
  const chatMessagesRef = useRef(null);

  // Funzione per recuperare la chat dal backend
  const fetchChat = async () => {
    await axios
      .post(backend + '/friends/chatHandler', { friendUsername })
      .then((response) => {
        setChat(response.data);
        setLoadingChat(false); // Imposta il caricamento della chat su false dopo aver ricevuto i dati
      })
      .catch((error) => {
        console.log(error.response.data.message);
      });
  };

  // Caricamento della chat che viene eseguito quando cambia il nome dell'amico, il backend o c'é un aggiornamento della chat
  useEffect(() => {
    // Chiamata alla funzione fetchChat quando cambiano il nome dell'amico o il backend
    setLoadingChat(true); // Imposta il caricamento della chat su true prima dell'esecuzione di fetchChat
    fetchChat(); //Esegue l'axios della chat se il nuovo messaggio è arrivato nella chat aperta al momento
  }, [friendUsername, backend]);

  // Caricamento della chat che viene eseguito quando c'é un aggiornamento della chat
  useEffect(() => {
    // Chiamata alla funzione fetchChat quando c'è una aggiornamento della chat in cui ci troviamo
    if (friendUsername) {
      if (chatUpdates.usrs.includes(friendUsername)) {
        // Imposta il caricamento della chat su true prima dell'esecuzione di fetchChat
        setLoadingChat(true);
        //Esegue l'axios della chat se il nuovo messaggio è arrivato nella chat aperta al momento
        fetchChat();
      }
    }
  }, [chatUpdates]);

  // Effetto che viene eseguito quando cambia la chat
  useEffect(() => {
    // Posiziona la scrollbar all'estremità inferiore dell'elemento chat-messages
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chat]);

  const handleMsgInput = (e) => {
    // Gestisce l'input del messaggio
    setMsgContent(e.target.value);
  };

  const handleMsgSubmit = async (e) => {
    e.preventDefault();
    try {
      const msgToSubmit = msgContent;
      setMsgContent('');
      // Invia il messaggio al backend per l'invio
      await axios.post(backend + '/friends/messageSubmit', {
        friendUsername: friendUsername,
        message: msgToSubmit
      })
        .then((response) => {
          setMsgInfo(response.data.message);
        })
        .catch((error) => {
          setMsgInfo(error.response.data.message);
        });
    } catch (error) {
      setMsgInfo(error);
    }
  };

  return (
    <div className="column">
      {//Se è impostato che non deve utilizzare la home (saltare il blocco della chat) mostra la chat con l'amico selezionato
        !useHome && (
          <div className="box chat-box">
            {/* Contenitore dei messaggi */}
            {loadingChat ? ( // Se la chat è in caricamento, mostra la gif di caricamento
              <div className="has-text-centered">
                <img src={loadingif} alt="Loading Gif" />
              </div>
            ) : (
              <div ref={chatMessagesRef} className="has-background-white p-4 chat-messages" style={{ maxHeight: `calc(84vh - ${navbarHeight}px)` }}>
                {chat.length > 0 && (
                  // Mappa dei messaggi presenti nella chat
                  chat.map((message, i) => (
                    <div key={i} className={`message ${message.from === cookies.userData._id ? 'is-info' : 'is-link'}`}>
                      <div className={`message-header ${message.from === cookies.userData._id ? 'is-justify-content-flex-end' : ''}`}>
                        {/* Mittente del messaggio */}
                        <p className="message-sender">{message.from === cookies.userData._id ? 'Tu' : friendUsername}</p>
                      </div>
                      <div className="message-body">
                        {/* Contenuto del messaggio */}
                        <p className={`${message.from === cookies.userData._id ? 'is-flex is-flex-direction-row-reverse' : ''}`}>{message.content}</p>
                        {/* Timestamp del messaggio */}
                        <p className={`message-timestamp ${message.from === cookies.userData._id ? 'is-pulled-left' : 'is-pulled-right'}`}>
                          {new Date(message.date).toLocaleString("it-IT", dateOptions)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {/* Form per l'invio di messaggi */}
            <form onSubmit={handleMsgSubmit}>
              <div className="field has-addons has-addons-centered p-3 sendbar">
                <div className="control is-expanded">
                  {/* Input per il contenuto del messaggio */}
                  <input
                    className="input"
                    type="text"
                    placeholder={msgInfo}
                    value={msgContent}
                    onChange={handleMsgInput}
                  />
                </div>
                <div className="control">
                  {/* Pulsante di invio del messaggio */}
                  <button className="button is-primary" type="submit">
                    Invia
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
    </div>
  );

}