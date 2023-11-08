import React, { useState, useEffect } from 'react';
import Start from './Start';
import Main from './Main';
import icon from './icon.png';
import './custom.css';
import { useCookies } from 'react-cookie'; //Hook che consente di leggere, scrivere e rimuovere i cookie nel componente React
import { Routes, Route } from 'react-router-dom';
import loadingif from './loading.gif';

export default function App() {
  //Istanza di useCookies() usata per le varie operazioni
  const [cookies] = useCookies();
  //Vari stati relativi alla connesione col Backend
  //Nota: Cosí come questo semplice controllo che permette di capire in che ambiente ci troviamo, ci sono numerosi controlli nel codice che permettono di eseguire lo stesso codice sia in locale (ad es con WebStorm) che tramite Render online
  const [backend, setBackend] = useState('');

  //Controllo riguardante l'esecuzione del programma in locale o tramite internet su Render
  useEffect(() => {
    if (window.location.origin.includes('localhost')) {
      setBackend('http://localhost:3000');
      console.log('Esecuzione in Localhost');
    } else {
      setBackend('https://flamsg.onrender.com');
      console.log('Esecuzione in Render');
    }
  }, []);

  return (
    <div className="App">
      {/* Verifica se è presente un oggetto userData nei cookie */}
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
        //Se il backend non è ancora stato caricato, mostra la gif di caricamento
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-half">
              <div className="is-flex is-flex-direction-column is-align-items-center is-justify-content-center" style={{ height: '100vh' }}>
                <figure className="image has-text-centered">
                  <img src={loadingif} alt="Loading Gif" />
                </figure>
                <p className="has-text-primary is-size-4 mt-3 has-text-weight-semibold">Caricamento in corso...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}         