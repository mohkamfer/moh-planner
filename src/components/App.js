import React from 'react';
import Titlebar from './titlebar';
import Suggestions from './suggestions';
import Timeline from './timeline';

import '../assets/css/index.css';

function App() {
  return (
    <React.Fragment>
      <Titlebar />
      <div id="container">
        <Suggestions />
        <Timeline />
      </div>
    </React.Fragment>
  )
};

export default App;
