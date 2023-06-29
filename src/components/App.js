import React from 'react';
import Ongoing from './ongoing';
import Timeline from './timeline';
import Titlebar from './titlebar';

import '../assets/css/index.css';
import Sidebar from './sidebar';

function App() {
  return (
    <React.Fragment>
      <Titlebar />
      <div id="container">
        <Ongoing />
        <div id="content">
          <Timeline />
          <Sidebar />
        </div>
      </div>
    </React.Fragment>
  )
};

export default App;
