import React, { useState } from 'react';
import axios from 'axios';
import { useCookies } from 'react-cookie';

export default function Start({ icon, backend }) {
  // Stati per le informazioni, nome utente, password, checkbox "Ricordami" e visualizzazione password
  const [info, setInfo] = useState('Accedi al tuo account o creane uno nuovo');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cookies, setCookie] = useCookies();
  axios.defaults.withCredentials = true;

  // Gestore per il cambiamento del nome utente
  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  // Gestore per il cambiamento della password
  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  // Gestore per il cambiamento del valore del checkbox "Ricordami"
  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  // Funzione per mostrare/nascondere la password
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Gestore per l'accesso
  const handleLogin = async (event) => {
    event.preventDefault();
    axios
      .post(backend + '/users/login', { username, password, rememberMe, firsttime: true })
      .then((response) => {
        if (response.status === 200) {
          setInfo(response.data.message);
        }
      })
      .catch((error) => {
        setInfo(error.response.data.message);
      });
  };

  // Gestore per la registrazione
  const handleRegistration = async (event) => {
    event.preventDefault();
    axios
      .post(backend + '/users/register', { username, password })
      .then((response) => {
        setInfo(response.data.message);
      })
      .catch((error) => {
        setInfo(error.response.data.message);
      });
  };

  return (
    <div className="hero is-fullheight">
      <div className="hero-body">
        <div className="container">
          {/* Intestazione */}
          <div className="has-text-centered">
            <div className="is-flex is-flex-direction-column is-align-items-center is-justify-content-center">
              <img src={icon} alt="Icona" className="bigicon" />
              <h1 className="title is-1">FlaMSG</h1>
            </div>
            <h2 className="subtitle is-4 mt-5">{info}</h2>
          </div>

          {/* Form di accesso */}
          <div className="columns is-centered mt-5">
            <div className="column is-half">
              <form onSubmit={handleLogin}>
                {/* Campo "Username" */}
                <div className="field">
                  <label className="label">Username</label>
                  <div className="control">
                    <input
                      className="input"
                      type="username"
                      placeholder="Inserisci il tuo username"
                      value={username}
                      onChange={handleUsernameChange}
                      required
                    />
                  </div>
                </div>

                {/* Campo "Password" */}
                <div className="field">
                  <label className="label">Password</label>
                  <div className="control has-icons-right">
                    <input
                      className="input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Inserisci la tua password"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                    />
                    {/* Icona per mostrare/nascondere la password */}
                    <span className="icon is-small is-right" style={{ pointerEvents: 'auto' }} onClick={toggleShowPassword}>
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </span>
                  </div>
                </div>

                {/* Checkbox "Ricordami" */}
                <div className="field">
                  <div className="control">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={handleRememberMeChange}
                      />
                      <span className="ml-1 checkmark"></span>
                      Ricordami
                    </label>
                  </div>
                </div>

                {/* Pulsanti "Accedi" e "Registrati" */}
                <div className="field is-grouped">
                  <div className="control">
                    <button className="button is-link" onClick={handleLogin}>
                      Accedi
                    </button>
                  </div>
                  <div className="control">
                    <button className="button is-primary is-light" onClick={handleRegistration}>
                      Registrati
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          {/* Informazioni sulla natura e la sicurezza del progetto */}
          <div className="has-text-centered mt-5">
            <p className="is-size-6">
              <strong>Nota:</strong> Questo progetto è per scopi educativi e non è destinato all'uso in produzione. I messaggi non sono crittografati, e non è disponibile una politica sulla privacy. Si prega di fare attenzione quando si condividono informazioni sensibili. Solo le password sono crittografate per motivi di sicurezza. Questo sito utilizza un solo cookie per mantenere la sessione di login attiva, 0 cookie esterni.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

};