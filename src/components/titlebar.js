import React from 'react';

import '../assets/css/titlebar/titlebar.css';

const { ipcRenderer } = require('electron');

function Titlebar() {
  const minimize = (e) => {
    ipcRenderer.send('minimize');
  };

  const maximize = (e) => {
    ipcRenderer.send('maximize');
  };

  const close = (e) => {
    ipcRenderer.send('close');
  };

  return (
    <div className="titlebar">
      <span className="title">moh-planner</span>
      <div className="wc-box">
        <span onClick={minimize} className="minimize"></span>
        <span onClick={maximize} className="maximize"></span>
        <span onClick={close} className="close"></span>
      </div>
    </div>
  );
}

export default Titlebar;
