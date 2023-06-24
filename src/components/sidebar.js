import React, { useEffect, useState, useRef } from 'react';

import '../assets/css/sidebar.css';

import $ from 'jquery';

const { ipcRenderer } = require('electron');

function Sidebar() {

  function useStateRef(initialValue) {
    const [value, setValue] = useState(initialValue);
    const ref = useRef(value);
    useEffect(() => {
      ref.current = value;
    }, [value]);
    return [value, setValue, ref];
  }

  const [tasks, setTasks, tasksRef] = useStateRef([]);
  const [loaded, setLoaded] = useState(false);

  const saveTasks = (tasksList) => {
    localStorage.setItem('tasks', JSON.stringify(tasksList || []));
  }

  const loadTasks = () => {
    setTasks(JSON.parse(localStorage.getItem('tasks') || "[]"));
    setLoaded(true);
  }

  const addTask = (taskName) => {
    setTasks([...tasksRef.current, taskName.trim()]);
  }

  const handleInputKeyDown = (e) => {
    let key = e.key;
    let text = e.target.value;
    if (key === "Enter") {
      if (text === "") return;
      addTask(text);
      e.target.value = "";
    }
  }

  const handleDragStart = (event) => {
    event.dataTransfer.setDragImage(new Image(), 0, 0);
  }

  const handleDragEnd = (e) => {
    let listItem = e.target;
    let index = parseInt(listItem.getAttribute("index"));

    ipcRenderer.send("add-task-from-sidebar", index, e.pageX, e.pageY);
  }

  useEffect(() => {
    loadTasks();
    ipcRenderer.on("remove-task-from-sidebar", (event, index) => {
      setTasks(tasksRef.current.filter((_, i) => i !== index));
    })
  }, []);

  useEffect(() => {
    if (loaded)
      saveTasks(tasksRef.current);
  }, [tasks]);

  return (
    <div className="sidebar">
      <h4 id="sidebar-title">Tasks</h4>
      <ul id="task-list">
        <input onKeyDown={handleInputKeyDown} id="new-task-input" placeholder="Add new"></input>
        {tasks.map((task, index) => <li key={index} index={index} onDragStart={handleDragStart} onDragEnd={handleDragEnd} draggable="true">{task}<span className="remove-task">x</span></li>)}
      </ul>
    </div>
  );
}

export default Sidebar;
