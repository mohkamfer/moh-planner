import React, { useEffect, useState } from 'react';

import '../assets/css/sidebar.css';

const { ipcRenderer } = require('electron');

function Sidebar() {

  const [tasks, setTasks] = useState([]);

  const addTask = (taskName) => {
    setTasks([...tasks, taskName]);
  }

  const handleInputKeyDown = (e) => {
    let key = e.key;
    let text = e.target.value;
    if (key === "Enter") {
      if (text === "") return;
      ipcRenderer.send("add-task", text);
      addTask(text);
      e.target.value = "";
    }
  }

  return (
    <div className="sidebar">
      <h4 id="sidebar-title">Tasks</h4>
      <ul id="task-list">
        <input onKeyDown={handleInputKeyDown} id="new-task-input" placeholder="Add new"></input>
        {tasks.map((task, index) => <li key={index}>{task}</li>)}
      </ul>
    </div>
  );
}

export default Sidebar;
