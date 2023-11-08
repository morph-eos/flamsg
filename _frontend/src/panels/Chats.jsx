import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';

export default function Chats({ backend, friendListUpdates, friendRequestUpdates, friendUsername, navbarHeight, setUseHome }) {
  // Impostazione delle opzioni di default per Axios
  axios.defaults.withCredentials = true;

  // Utilizzo del hook useCookies per ottenere i cookie
  const [cookies] = useCookies();

  // Dichiarazione degli stati utilizzati nel componente
  const [friendList, setFriendList] = useState([]); // Lista degli amici
  const [friendName, setFriendName] = useState(''); // Nome dell'amico
  const [infoFriend, setInfoFriend] = useState('Username amico'); // Informazioni sull'amico
  const [pendingFList, setPendingFList] = useState([]); // Lista delle richieste di amicizia in sospeso
  const [activeMessageId, setActiveMessageId] = useState(''); // ID del messaggio attivo

  // Effetto eseguito quando cambiano gli aggiornamenti delle richieste di amicizia
  useEffect(() => {
    axios
      .post(backend + '/users/logOrQuit', { exit: false }) // Richiesta al backend per verificare i cookie
      .then((response) => {
        if (response.ok) {
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
          console.log('Accesso fallito, riesegui il login');
          if (cookies) {
            // Elimina tutti i cookie
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

  // Effetto eseguito quando cambiano gli aggiornamenti della lista amici
  useEffect(() => {
    if (friendUsername) {
      setActiveMessageId(friendUsername);
    }
    const fetchFriendList = async () => {
      // Richiesta al backend per ottenere la lista degli amici
      await axios.post(backend + '/friends/friendList')
        .then((response => {
          setFriendList(response.data);
          //Controllo che cerca lo username amico nello URL nella lista di amicizia e in caso non lo sia lo pulisce
          const contieneUsername = response.data.some(
            (oggetto) => oggetto.username === friendUsername
          );
          if (!contieneUsername && friendUsername) {
            setUseHome(true);
          }
        }))
        .catch((error) => {
          console.log(error.response.data.message);
        });
    };
    fetchFriendList();
  }, [friendListUpdates]);

  // Elimina amico/chat
  const deleteFriendship = async (r_username) => {
    // Richiesta al backend per eliminare una amicizia (con relativa chat)
    await axios.post(backend + '/friends/deleteFriend', { friendUsername: r_username })
      .catch((error) => {
        console.log(error.response.data.message);
      });
  };

  // Gestione dell'input del nome dell'amico
  const handleInputChange = (e) => {
    setFriendName(e.target.value);
  };

  // Gestione dell'invio del modulo
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Richiesta al backend per aggiungere un amico
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

  // Accetta una richiesta di amicizia
  const handleAcceptRequest = async (r_username) => {
    await axios.post(backend + '/friends/acceptRequest', { friendUsername: r_username })
      .catch((error) => {
        console.log(error.response.data.message);
      });
  };

  // Rifiuta una richiesta di amicizia
  const handleDenyRequest = async (r_username) => {
    await axios.post(backend + '/friends/rejectRequest', { friendUsername: r_username })
      .catch((error) => {
        console.log(error.response.data.message);
      });
  };

  // Gestisce il clic su un amico
  const handleFriendClick = (clickedFriend) => {
    setActiveMessageId(clickedFriend.username);
  };

  return (
    <aside className="menu">
      <ul className="menu-list chat-list" style={{ maxHeight: `calc(83vh - ${navbarHeight}px)` }}>
        {/* Se la lista degli amici non è vuota, mostra ogni amico */}
        {friendList.length > 0 && (
          friendList.map((friend) => (
            <li key={friend.username}>
              {/* Link per aprire la chat con l'amico */}
              <Link
                className={`chat-link ${friend.username === activeMessageId ? 'is-active' : ''}`}
                to={`/${friend.username}`}
                onClick={() => handleFriendClick(friend)}
              >
                <span className="icon">
                  <i className="fas fa-comment"></i>
                </span>
                <label>{friend.username}</label>
                {/* Icona per eliminare amico e chat*/}
                <span
                  className="icon is-small is-pulled-right"
                  style={{ pointerEvents: 'auto' }}
                  onClick={() => deleteFriendship(friend.username)}
                >
                  <i className={`fas fa-trash`}></i>
                </span>
                {/* Mostra l'ultimo messaggio scambiato con l'amico */}
                {friend.lastMessage && <div className="last-message">{friend.lastMessage}</div>}
              </Link>
            </li>
          ))
        )}
      </ul>
      <div className="box">
        {/* Mostra la lista delle richieste di amicizia in sospeso */}
        <div className="scrollable-list-container">
          <div className="scrollable-list">
            {pendingFList.length > 0 && (
              pendingFList.map((r_username) => (
                <div className="bubble" key={r_username}>
                  <span className="username">{r_username}</span>
                  <div className="buttons">
                    <div className="field is-grouped">
                      {/* Pulsanti per accettare o rifiutare la richiesta di amicizia */}
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
        {/* Form per aggiungere un amico */}
        <form onSubmit={handleSubmit}>
          <div className="field has-addons has-addons-centered p-3">
            <div className="control is-expanded">
              {/* Input per inserire il nome dell'amico da aggiungere */}
              <input
                className="input"
                type="text"
                placeholder={infoFriend}
                value={friendName}
                onChange={handleInputChange}
              />
            </div>
            <div className="control">
              {/* Pulsante per aggiungere l'amico */}
              <button className="button is-primary" type="submit">
                Aggiungi
              </button>
            </div>
          </div>
        </form>
      </div>
    </aside>
  );

}