import React from 'react';

import '../assets/css/titlebar/titlebar.css';

function Titlebar() {
  const minimize = (e) => {
    win.minimize();
  };

  const maximize = (e) => {
    win.setFullScreen(!win.isFullScreen());
  };

  const close = (e) => {
    win.close();
  };

  return (
    <div class="titlebar">
      <span class="title">moh-planner</span>
      <div class="wc-box">
        <span onClick={minimize} class="minimize"></span>
        <span onClick={maximize} class="maximize"></span>
        <span onClick={close} class="close"></span>
      </div>
    </div>
  );
}

export default Titlebar;
