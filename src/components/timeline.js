import React, { useEffect, useState, useRef } from 'react';
import { format, subHours, addHours, differenceInMilliseconds } from 'date-fns';
import tippy, { followCursor } from 'tippy.js';
import { v4 as uuidv4 } from 'uuid';

import Sidebar from './sidebar';

import draggable from 'jquery-ui/ui/widgets/draggable';
import resizable from 'jquery-ui/ui/widgets/resizable';
import '../assets/jquery-ui/all.css';
import '../assets/css/vex-js/vex.css';
import '../assets/css/vex-js/vex-theme-default.css';

import notificationSoundMP3 from "../assets/sound/notification.mp3";

import '../assets/css/timeline.css';
import $ from 'jquery';

const { ipcRenderer } = require('electron');

var vex = require('vex-js')
vex.registerPlugin(require('vex-dialog'))
vex.defaultOptions.className = 'vex-theme-default'

const HOURS_BEFORE = 6;
const HOURS_TOTAL = 25;
const HOUR_WIDTH_PX = 120;

function Timeline() {

  function useStateRef(initialValue) {
    const [value, setValue] = useState(initialValue);
    const ref = useRef(value);
    useEffect(() => {
      ref.current = value;
    }, [value]);
    return [value, setValue, ref];
  }

  const [events, setEvents, eventsRef] = useStateRef([]);
  const [loaded, setLoaded] = useState(false);
  let shiftKeyPressed = false;

  const addEvent = (e) => {
    e.preventDefault();
    const labels = $('.hour-label');
    const now = new Date();
    let cardLeft = parseInt($(e.target).css('left')) - 15;
    let index = parseInt(cardLeft / HOUR_WIDTH_PX);
    let minutes = (cardLeft % HOUR_WIDTH_PX) / 2;
    let nearestLabel = labels.eq(index);
    let eventDate = new Date(now.getFullYear(), now.getMonth(), nearestLabel.attr('day'), nearestLabel.attr('hour'), minutes, 0);
    vex.dialog.prompt({
      message: 'Enter event title',
      placeholder: 'Event title',
      callback: function (value) {
        if (value) {
          setEvents([...events, {
            uuid: uuidv4(),
            title: value,
            time: eventDate,
            duration: 30,
          }]);

          saveEvents();
        }
      }
    });
  };

  const saveEvents = (eventsList) => {
    localStorage.setItem('events', JSON.stringify(eventsList || []));
  }

  const loadEvents = () => {
    const startDate = getStartDate();
    setEvents(JSON.parse(localStorage.getItem('events') || "[]")
      .map(event => ({...event, time: new Date(event.time)}))
      .filter(event => event.time >= startDate));
    setLoaded(true);
  }

  const getNowCeil = () => {
    let now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
  }

  const getStartDate = () => {
    return subHours(getNowCeil(), HOURS_BEFORE);
  }

  const scrollToNow = () => {
    $('.now-indicator')[0].scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });
  }

  const playNotification = () => {
    new Audio(notificationSoundMP3).play();
  }

  useEffect(() => {
    let now = new Date();
    let startDate = getStartDate();
    let labels = $('.hour-label');
    let labelWidth = 0, labelHeight = 0;
    let lastHour = now.getHours();

    const tick = () => {
      now = new Date();
      startDate = getStartDate();
      for (let i = 0, currentDate = startDate; i < HOURS_TOTAL; ++i, currentDate = addHours(startDate, i)) {
        const currentTime = format(currentDate, 'h aaa');
        const offset = i * HOUR_WIDTH_PX;
        const day = currentDate.getDate();
        const hour = currentDate.getHours();

        labels.eq(i).text(currentTime);
        labels.eq(i).attr('day', day);
        labels.eq(i).attr('hour', hour);
        labels.eq(i).css('left', offset);
        labels.eq(i).css('color', '#ccc');
      }

      let nowLabel = $(`.hour-label[day=${now.getDate()}][hour=${now.getHours()}]`);
      $('.now-indicator').css('left', `${parseInt(nowLabel.css('left')) + (labelWidth / 2) + (parseInt(now.getMinutes()) * (HOUR_WIDTH_PX / 60))}px`);

      if (now.getHours() !== lastHour) {
        setEvents([...eventsRef.current].filter(event => event.time >= startDate));
        scrollToNow();
      }
      lastHour = now.getHours();

      eventsRef.current && eventsRef.current.forEach(event => {
        if (Math.abs(differenceInMilliseconds(event.time, now)) < 1000) {
          vex.dialog.alert({
            message: `Happening now: ${event.title}`,
            afterOpen: function() {
              setTimeout(() => {
                this.close();
              }, 5000);
            }
          });

          playNotification();
        }
      });
    };

    labelWidth = parseInt(labels.eq(0).css('width'));
    labelHeight = parseInt(labels.eq(0).css('height'));

    tick();
    loadEvents();
    setInterval(tick, 2000);

    scrollToNow();

    $(document).on('click', '.event', function (e) {
      e.preventDefault();
      const uuid = e.target.getAttribute('uuid');
      let eventIndex = -1;
      const event = eventsRef.current.find(function (event, index) {
        eventIndex = index;
        return event.uuid === uuid;
      });

      if (event) {
        vex.dialog.open({
          message: 'Enter event title',
          input: [
            '<input value="' + event.title + '" name="title" type="text" placeholder="Event title" required />',
          ].join(''),
          buttons: [
            $.extend({}, vex.dialog.buttons.YES, { text: 'Save' }),
            $.extend({}, vex.dialog.buttons.NO, { text: 'Delete', className: 'red-background' })
          ],
          callback: function (value) {
            if (value) {
              event.title = value.title;
              eventsRef.current.splice(eventIndex, 1);
              setEvents([...eventsRef.current, event]);
            } else {
              eventsRef.current.splice(eventIndex, 1);
              setEvents([...eventsRef.current]);
            }
          }
        });
      }
    });

    $(document).on('mousewheel', '#main-timeline', function (e) {
      if ($(e.target).closest(".sidebar").length < 1) {
        if (e.originalEvent.wheelDelta / 120 > 0) {
          $('#main-timeline').scrollLeft($('#main-timeline').scrollLeft() - 25);
        } else {
          $('#main-timeline').scrollLeft($('#main-timeline').scrollLeft() + 25);
        }
      }
    });

    $(document).on('mousemove', '#main-timeline', function (e) {
      var x = (e.pageX - $('#main-timeline').offset().left) + $('#main-timeline').scrollLeft();
      var y = (e.pageY - $('#main-timeline').offset().top) + $('#main-timeline').scrollTop();
      if (y < labelHeight) {
        if ((x > (labelWidth / 2)) && (x < ($('#main-timeline')[0].scrollWidth - (labelWidth / 2)))) {
          x = Math.min(x, $('#main-timeline')[0].scrollWidth - (labelWidth / 2) - (HOUR_WIDTH_PX / 2)) - (labelWidth / 2);
          $('.new-event')
            .css('visibility', 'visible')
            .css('left', `${parseInt(x / (HOUR_WIDTH_PX / 2)) * (HOUR_WIDTH_PX / 2) + (labelWidth / 2)}px`);
          return;
        }
      }

      $('.new-event').css('visibility', 'hidden');
    });

    $(document).on('mousemove', function (e) {
      const id = e.target.id
      id && id !== 'main-timeline' && $('.new-event').css('visibility', 'hidden');
    });

    $(document).on('dragover', '#main-timeline', function (e) {
      shiftKeyPressed = e.shiftKey;
      e.preventDefault();
      
      var x = (e.pageX - $('#main-timeline').offset().left) + $('#main-timeline').scrollLeft();
      var y = (e.pageY - $('#main-timeline').offset().top) + $('#main-timeline').scrollTop();
      if (y < labelHeight) {
        if ((x > (labelWidth / 2)) && (x < ($('#main-timeline')[0].scrollWidth - (labelWidth / 2)))) {
          x = Math.min(x, $('#main-timeline')[0].scrollWidth - (labelWidth / 2) - (HOUR_WIDTH_PX / 2)) - (labelWidth / 2);
          $('.new-event')
            .css('visibility', 'visible')
            .css('left', `${parseInt(x / (HOUR_WIDTH_PX / 2)) * (HOUR_WIDTH_PX / 2) + (labelWidth / 2)}px`);
          return;
        }
      }

      $('.new-event').css('visibility', 'hidden');
    });

    ipcRenderer.on("add-task-from-sidebar", (event, index, folderId, eventX, eventY) => {
      var x = (eventX - $('#main-timeline').offset().left) + $('#main-timeline').scrollLeft();
      var y = (eventY - $('#main-timeline').offset().top) + $('#main-timeline').scrollTop();
      if (y < labelHeight) {
        if ((x > (labelWidth / 2)) && (x < ($('#main-timeline')[0].scrollWidth - (labelWidth / 2)))) {
          x = Math.min(x, $('#main-timeline')[0].scrollWidth - (labelWidth / 2) - (HOUR_WIDTH_PX / 2)) - (labelWidth / 2);
          let halfIndex = Math.floor(x / (HOUR_WIDTH_PX / 2));
          let minutes = halfIndex * 30;
          let eventTime = getStartDate();
          eventTime.setMinutes(eventTime.getMinutes() + minutes);
          
          let folder = $(`.folder-container[id=${folderId}]`);
          let task = folder.find(`li:nth-of-type(${index + 1})`);
          let taskName = task.find("span.task-name").text();
          setEvents([...eventsRef.current, {
            uuid: uuidv4(),
            title: taskName,
            time: eventTime,
            duration: 30,
          }]);

          saveEvents();

          if (!shiftKeyPressed) {
            // event.sender.send("remove-task-from-sidebar", index, folderId);
          }
          return;
        }
      }
    });

    return (() => {
      $(document).off('mousewheel', '#main-timeline');
      $(document).off('mousemove', '#main-timeline');
      $(document).off('mousemove');
      $(document).off('dragover');
      $(document).off('click', '.event');
    });
  }, []);

  useEffect(() => {
    $('.event').remove();
    events.forEach(event => {
      const label = $(`.hour-label[day=${event.time.getDate()}][hour=${event.time.getHours()}]`);
      const eventCard = $(`<div
      class="event"
      uuid="${event.uuid}"
      style="
        left:${parseInt(label.css('left')) + (parseInt(label.css('width')) / 2) + (parseInt(event.time.getMinutes() * (HOUR_WIDTH_PX / 60)))}px;
        width:${event.duration * (HOUR_WIDTH_PX / 60)}px">
        ${event.title}
      </div>`);
      tippy(eventCard[0], {
        content: `${event.title}<br>${format(event.time, 'do LLL p')}<br>Duration: ${event.duration} mins`,
        plugins: [followCursor],
        followCursor: 'horizontal',
        placement: 'bottom',
        allowHTML: true,
      });
      $('#main-timeline').append(eventCard);
      $(eventCard).draggable({
        containment: 'parent',
        scroll: true,
        axis: 'x',
        grid: [10, 0],
        stop: function (e, ui) {
          const labels = $('.hour-label');
          const now = new Date();
          let cardLeft = ui.position.left - 15;
          let index = parseInt(cardLeft / HOUR_WIDTH_PX);
          let minutes = (cardLeft % HOUR_WIDTH_PX) / 2;
          let nearestLabel = labels.eq(index);
          let eventDate = new Date(now.getFullYear(), now.getMonth(), nearestLabel.attr('day'), nearestLabel.attr('hour'), minutes, 0);
          let uuid = e.target.getAttribute('uuid');
          let eventIndex = -1;
          const event = eventsRef.current.find(function (event, index) {
            eventIndex = index;
            return event.uuid === uuid;
          });
          if (event) {
            event.time = eventDate;
            eventsRef.current.splice(eventIndex, 1);
            setTimeout(function() {
              setEvents([...eventsRef.current, event]);
            }, 0);
          }
        },
      }).resizable({
        handles: 'e',
        resize: function(e, ui) {
          ui.size.width = Math.max(20, 10 + parseInt(ui.size.width / 10) * 10);
        },
        stop: function (e, ui) {
          let cardWidth = ui.size.width;
          let uuid = e.target.getAttribute('uuid');
          let eventIndex = -1;
          const event = eventsRef.current.find(function (event, index) {
            eventIndex = index;
            return event.uuid === uuid;
          });
          if (event) {
            event.duration = cardWidth / 2;
            eventsRef.current.splice(eventIndex, 1);
            setTimeout(function() {
              setEvents([...eventsRef.current, event]);
            }, 0);
          }
        },
      });
    });

    if (loaded)
      saveEvents(events);
  }, [events]);

  return (
    <div id="main-timeline">
      {Array(HOURS_TOTAL).fill(0).map((_, index) => (
        <span key={index} className="hour-label"></span>
      ))}

      <div className="now-indicator"></div>
      <div className="new-event" onClick={addEvent}></div>
    </div>
  );
}

export default Timeline;
