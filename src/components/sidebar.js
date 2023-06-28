import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import '../assets/css/sidebar.css';

import $ from 'jquery';

const { ipcRenderer } = require('electron');

var vex = require('vex-js')

function Sidebar() {

  function useStateRef(initialValue) {
    const [value, setValue] = useState(initialValue);
    const ref = useRef(value);
    useEffect(() => {
      ref.current = value;
    }, [value]);
    return [value, setValue, ref];
  }

  const [folders, setFolders, foldersRef] = useStateRef([]);
  const [loaded, setLoaded] = useState(false);

  const handleInputKeyDown = (e) => {
    let key = e.key;
    let taskName = e.target.value;
    if (key === "Enter") {
      if (taskName === "") return;
      let folder = $(e.target).parents(".folder-container");
      let folderId = folder.attr("id");
      addTask(taskName, folderId);
      e.target.value = "";
    }
  }

  const handleDragStart = (event) => {
    event.dataTransfer.setDragImage(new Image(), 0, 0);
  }

  const handleDragEnd = (e) => {
    let listItem = e.target;
    let index = parseInt(listItem.getAttribute("index"));
    let folder = $(e.target).parents(".folder-container");
    let folderId = folder.attr("id");

    ipcRenderer.send("add-task-from-sidebar", index, folderId, e.pageX, e.pageY);
  }

  const handleAddNewFolder = (e) => {
    e.preventDefault();
    vex.dialog.prompt({
      message: 'Enter folder name',
      placeholder: 'Folder name',
      callback: function (value) {
        if (value) {
          addTaskFolder(value);
        }
      }
    });
  }

  const addTaskFolder = (folderName) => {
    setFolders([...foldersRef.current, {
      id: uuidv4(),
      name: folderName.trim(),
      tasks: []
    }]);
  }

  const writeFolders = (tasksList) => {
    localStorage.setItem('task-folders', JSON.stringify(tasksList || []));
  }

  const readFolders = () => {
    setFolders(JSON.parse(localStorage.getItem('task-folders') || "[]"));
    setLoaded(true);
  }

  const addTask = (taskName, folderId) => {
    let currentFolders = foldersRef.current;
    let targetFolder = currentFolders.find(folder => folder.id === folderId);
    targetFolder.tasks.push(taskName.trim());
    setFolders([...currentFolders]);
  }

  const removeTask = (taskIndex, folderId) => {
    let currentFolders = foldersRef.current;
    let targetFolder = currentFolders.find(folder => folder.id === folderId);
    targetFolder.tasks.splice(taskIndex, 1);
    setFolders([...currentFolders]);
  }

  useEffect(() => {
    readFolders();
    ipcRenderer.on("remove-task-from-sidebar", (event, index, folderId) => {
      removeTask(index, folderId);
    });

    $(document).on("click", ".remove-task", (e) => {
      e.stopPropagation();
      e.preventDefault();
      let itemIndex = parseInt($(e.target).parent().attr("index"));
      let folderId = $(e.target).parents(".folder-container").attr("id");
      removeTask(itemIndex, folderId);
    });

    $(document).on("click", ".remove-folder", (e) => {
      e.stopPropagation();
      e.preventDefault();
      let folderId = $(e.target).parents(".folder-container").attr("id");
      setFolders([...foldersRef.current.filter(folder => folder.id !== folderId)]);
    });

    $(document).on("click", ".sidebar-title", (e) => {
      e.stopPropagation();
      e.preventDefault();
      $(e.target).next().slideToggle();
    });

    return () => {
      $(document).off("click", ".remove-task");
      $(document).off("click", ".remove-folder");
      $(document).off("click", ".sidebar-title");
    }
  }, []);

  useEffect(() => {
    if (loaded)
      writeFolders(foldersRef.current);
  }, [folders]);

  return (
    <div className="sidebar">
      {folders.map((folder, folderIndex) =>
      <div className="folder-container" key={folderIndex} id={folder.id}>
        <span className="remove-folder">x</span>
        <h4 className="sidebar-title">{folder.name}</h4>
        <ul className="task-list">
          <input onKeyDown={handleInputKeyDown} className="new-task-input" placeholder="Add new"></input>
          {folder.tasks.map((task, taskIndex) =>
            <li key={taskIndex} index={taskIndex} onDragStart={handleDragStart} onDragEnd={handleDragEnd} draggable="true">
              <span className="task-name">{task}</span>
              <span className="remove-task">x</span>
            </li>
          )}
        </ul>
      </div>)
        }
      <span className="add-folder-button" onClick={handleAddNewFolder}>+</span>
    </div>
  );
}

export default Sidebar;
