import { differenceInMilliseconds, format } from 'date-fns';
import $ from 'jquery';
import React, { useEffect, useRef, useState } from 'react';
import '../assets/css/ongoing.css';
import upcomingSound from "../assets/sound/upcoming.mp3";
import startedSound from "../assets/sound/start.mp3";
import endedSound from "../assets/sound/end.mp3";

const { ipcRenderer } = require('electron');

function Ongoing() {

  function useStateRef(initialValue) {
    const [value, setValue] = useState(initialValue);
    const ref = useRef(value);
    useEffect(() => {
      ref.current = value;
    }, [value]);
    return [value, setValue, ref];
  }

  let [loaded, setLoaded] = useState(false);
  let [ongoing, setOngoing, ongoingRef] = useStateRef();
  let [upcoming, setUpcoming, upcomingRef] = useStateRef();

  const playNotification = (type) => {
    if (type == "upcoming") {
      let upcomingAudio = new Audio(upcomingSound);
      upcomingAudio.volume = 0.5;
      upcomingAudio.play();
    } else if (type == "started") {
      new Audio(startedSound).play();
    } else if (type == "ended") {
      new Audio(endedSound).play();
    }
  };

  function formatCountdown(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);
  
    const formattedTime = [];
  
    if (days > 0) {
      formattedTime.push(
        <span key="days">
          {days}
          <span className="ongoing-subscript">d</span>
        </span>
      );
    }
  
    if (hours > 0) {
      formattedTime.push(
        <span key="hours">
          {hours}
          <span className="ongoing-subscript">h</span>
        </span>
      );
    }
  
    if (minutes > 0) {
      formattedTime.push(
        <span key="minutes">
          {minutes}
          <span className="ongoing-subscript">m</span>
        </span>
      );
    }
  
    if (seconds > 0) {
      formattedTime.push(
        <span key="seconds">
          {seconds}
          <span className="ongoing-subscript">s</span>
        </span>
      );
    }
  
    return formattedTime;
  }
  
  const handleTick = (e, events) => {
    let foundUpcoming = false;
    let foundOngoing = false;
    let ongoingNearEnd = false;
    for (let event of events) {
      const now = new Date();
      const diffMillis = differenceInMilliseconds(event.time, now);
      const diffSecs = diffMillis / 1000;

      if (diffSecs >= 299 && diffSecs <= 301) {
        foundUpcoming = true;
        setUpcoming(event);
        playNotification("upcoming");
      }

      if ((diffSecs < 0) && (diffSecs > (-event.duration * 60))) {
        foundOngoing = true;
        let eventEndDate = new Date(event.time);
        eventEndDate.setTime(eventEndDate.getTime() + event.duration * 60 * 1000);
        const millisToEnd = eventEndDate - new Date();
        let newOngoing = {
          name: event.title,
          timeLeft: formatCountdown(millisToEnd),
          startDate: format(event.time, "h:mm a"),
          endDate: format(eventEndDate, "h:mm a")
        };

        if (ongoingRef.current == null) {
          playNotification("started");
        }

        setOngoing(newOngoing);
      }

      if (Math.abs(diffSecs + event.duration * 60) < 1) {
        ongoingNearEnd = true;
        playNotification("ended");
      }
    }

    if (!foundUpcoming) {
      setUpcoming(null);
    }

    if (ongoingNearEnd) {
      foundOngoing = false;
    }

    if (!foundOngoing) {
      setOngoing(null);
      $(".ongoing-placeholder").removeClass("hidden");
    } else {
      $(".ongoing-placeholder").addClass("hidden");
    }

    setLoaded(true);
  };

  useEffect(() => {
    ipcRenderer.on("tick", handleTick);

    return (() => {
      ipcRenderer.off("tick", handleTick);
    });
  }, []);

  return (
    <div id="ongoing-details">
      <span className="ongoing-placeholder">No ongoing events</span>
      {
        ongoing && (
          <div className="ongoing-container">
            <span className="ongoing-timer">{ongoing.timeLeft}</span>
            <span className="ongoing-name">{ongoing.name}</span>
            <span className="ongoing-dates">{ongoing.startDate} - {ongoing.endDate}</span>
          </div>
        )
      }
    </div>
  );
}

export default Ongoing;
