import React, { useEffect, useState } from 'react';
import { format, subHours, addHours } from 'date-fns';
import tippy, { followCursor } from 'tippy.js';
import { v4 as uuidv4 } from 'uuid';

import draggable from 'jquery-ui/ui/widgets/draggable';
import resizable from 'jquery-ui/ui/widgets/resizable';
import '../assets/jquery-ui/all.css';
import '../assets/css/vex-js/vex.css';
import '../assets/css/vex-js/vex-theme-os.css';

import '../assets/css/timeline.css';
import $ from 'jquery';

var vex = require('vex-js')
vex.registerPlugin(require('vex-dialog'))
vex.defaultOptions.className = 'vex-theme-os'

function Timeline() {

  const [events, setEvents] = useState([]);

  const addEvent = (e) => {
    e.preventDefault();
    const labels = $('.hour-label');
    const now = new Date();
    let cardLeft = parseInt($(e.target).css('left')) - 15;
    let index = parseInt(cardLeft / 120);
    let minutes = (cardLeft % 120) / 2;
    let nearestLabel = labels.eq(index);
    let eventDate = new Date(now.getFullYear(), now.getMonth() + 1, nearestLabel.attr('day'), nearestLabel.attr('hour'), minutes, 0);
    vex.dialog.prompt({
      message: 'Enter event title',
      placeholder: 'Event title',
      callback: function (value) {
        setEvents([...events, {
          uuid: uuidv4(),
          title: value,
          time: eventDate,
          duration: 30,
        }]);
      }
    });};

  useEffect(() => {
    let now = new Date();
    const nowCeil = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
    const startDate = subHours(nowCeil, 12);
    const endDate = addHours(nowCeil, 12);
    const labels = $('.hour-label');
    let labelWidth = 0, labelHeight = 0;

    const tick = () => {
      now = new Date();
      for (let i = 0, currentDate = startDate; i < 25; ++i, currentDate = addHours(startDate, i)) {
        const currentTime = format(currentDate, 'h aaa');
        const offset = i * 120;
        const day = currentDate.getDate();
        const hour = currentDate.getHours();

        labels.eq(i).text(currentTime);
        labels.eq(i).attr('day', day);
        labels.eq(i).attr('hour', hour);
        labels.eq(i).css('left', offset);
        labels.eq(i).css('color', '#ccc');
      }

      labelWidth = parseInt(labels.eq(0).css('width'));
      labelHeight = parseInt(labels.eq(0).css('height'));

      let nowLabel = $(`.hour-label[day=${now.getDate()}][hour=${now.getHours()}]`);
      $('.now-indicator').css('left', `${parseInt(nowLabel.css('left')) + (labelWidth / 2) + (parseInt(now.getMinutes()) * 2)}px`);
    };

    tick();

    setInterval(tick, 2000);

    $('.now-indicator')[0].scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });

    $(document).on('mousewheel', '#main-timeline', function (e) {
      if (e.originalEvent.wheelDelta / 120 > 0) {
        $('#main-timeline').scrollLeft($('#main-timeline').scrollLeft() - 25);
      } else {
        $('#main-timeline').scrollLeft($('#main-timeline').scrollLeft() + 25);
      }
    });

    $(document).on('mousemove', '#main-timeline', function (e) {
      var x = (e.pageX - $('#main-timeline').offset().left) + $('#main-timeline').scrollLeft();
      var y = (e.pageY - $('#main-timeline').offset().top) + $('#main-timeline').scrollTop();
      if (y < labelHeight) {
        if ((x > (labelWidth / 2)) && (x < ($('#main-timeline')[0].scrollWidth - (labelWidth / 2)))) {
          x = Math.min(x, $('#main-timeline')[0].scrollWidth - (labelWidth / 2) - 60) - (labelWidth / 2);
          $('.new-event').css('visibility', 'visible').css('left', `${parseInt(x / 60) * 60 + (labelWidth / 2)}px`);
          return;
        }
      }

      $('.new-event').css('visibility', 'hidden');
    });

    $(document).on('mousemove', function (e) {
      const id = e.target.id
      id && id !== 'main-timeline' && $('.new-event').css('visibility', 'hidden');
    });

    return (() => {
      $(document).off('mousewheel', '#main-timeline');
      $(document).off('mousemove', '#main-timeline');
      $(document).off('mousemove');
    });
  }, []);

  useEffect(() => {
    $('.event').remove();
    events.forEach(event => {
      const label = $(`.hour-label[day=${event.time.getDate()}][hour=${event.time.getHours()}]`);
      const eventCard = $(`<div
      class="event"
      style="
        left:${parseInt(label.css('left')) + (parseInt(label.css('width')) / 2) + (parseInt(event.time.getMinutes() * 2))}px;
        width:${event.duration * 2}px">
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
      }).resizable({
        handles: 'e',
        resize: function(e, ui) {
          ui.size.width = Math.max(20, 10 + parseInt(ui.size.width / 10) * 10);
        },
      });
    });
  }, [events]);

  return (
    <div id="main-timeline">
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <span className="hour-label"></span>
      <div className="now-indicator"></div>
      <div className="new-event" onClick={addEvent}></div>
    </div>
  );
}

export default Timeline;
