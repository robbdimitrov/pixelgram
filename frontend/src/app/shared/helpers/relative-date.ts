'use strict';

// Globals

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Modifiers

function dateByAddingDays(date, days) {
  let nextDate = new Date(date);
  nextDate.setDate(date.getDate() + days);
  return nextDate;
}

function dateByAddingHours(date, hours) {
  let nextDate = new Date(date);
  nextDate.setHours(date.getHours() + hours);
  return nextDate;
}

function dateByAddingMinutes(date, minutes) {
  let nextDate = new Date(date);
  nextDate.setMinutes(date.getMinutes() + minutes);
  return nextDate;
}

function dateByAddingSeconds(date, seconds) {
  let nextDate = new Date(date);
  nextDate.setSeconds(date.getSeconds() + seconds);
  return nextDate;
}

// Helpers

function isSameWeek(date1, date2) {
    let weekStart = dateByAddingDays(date1, -7);
  return (date2 >= weekStart && date2 <= date1);
}

function numberFormatter(number) {
    return `${number < 10 ? '0' : ''}${number}`;
}

function timeFormatter(date) {
    return `${numberFormatter(date.getHours())}:${numberFormatter(date.getMinutes())}`;
}

function pluralFormatter(number, singular, plural) {
    return `${number} ${number === 1 ? singular : plural} ago`;
}

// Time difference

function timeDifference(now, date) {
  let seconds = Math.round((now - date) / 1000);
  let minutes = Math.round(seconds / 60);
  let hours = Math.round(minutes / 60);
  let days = Math.round(hours / 24);

  if (seconds < 5) {
    return 'Just now';
  } else if (seconds < 60) {
    return pluralFormatter(seconds, 'second', 'seconds');
  } else if (minutes < 60) {
    return pluralFormatter(minutes, 'minute', 'minutes');
  } else if (hours < 24) {
    return pluralFormatter(hours, 'hour', 'hours');
  } else {
    return pluralFormatter(days, 'day', 'days');
  }
}

function dateDifference(now, date) {
    let isCurrent = now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth();

  if (isCurrent && now.getDate() === date.getDate()) {
    return `Today at ${timeFormatter(date)}`;
  } else if (isCurrent && (now.getDate() - 1) === date.getDate()) {
    return `Yesterday at ${timeFormatter(date)}`;
  } else if (isCurrent && (now.getDate() + 1) === date.getDate()) {
    return `Tomorrow at ${timeFormatter(date)}`;
  } else if (isSameWeek(now, date)) {
    return `${weekDays[date.getDay()]} at ${timeFormatter(date)}`;
  }

  return date.toDateString();
}

// Relativity

export function relativeDate(date) {
  let now = new Date();

  if (now < dateByAddingDays(date, 1)) {
    return timeDifference(now, date);
  } else if (now < dateByAddingDays(date, 7)) {
    return dateDifference(now, date);
  } else if (now.getFullYear === date.getFullYear) {
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
