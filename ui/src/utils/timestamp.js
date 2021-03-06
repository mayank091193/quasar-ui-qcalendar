import { date } from 'quasar'

export const PARSE_REGEX = /^(\d{4})-(\d{1,2})(-(\d{1,2}))?([^\d]+(\d{1,2}))?(:(\d{1,2}))?(:(\d{1,2}))?(.(\d{1,3}))?$/
export const PARSE_TIME = /(\d\d?)(:(\d\d?)|)(:(\d\d?)|)/

export const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
export const DAYS_IN_MONTH_LEAP = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
export const DAYS_IN_MONTH_MIN = 28
export const DAYS_IN_MONTH_MAX = 31
export const MONTH_MAX = 12
export const MONTH_MIN = 1
export const DAY_MIN = 1
export const DAYS_IN_WEEK = 7
export const MINUTES_IN_HOUR = 60
export const HOURS_IN_DAY = 24
export const FIRST_HOUR = 0
export const MILLISECONDS_IN_DAY = 86400000
export const MILLISECONDS_IN_HOUR = 3600000
export const MILLISECONDS_IN_MINUTE = 60000

/* eslint-disable no-multi-spaces */
export const Timestamp = {
  date: '',       // YYYY-mm-dd
  time: '',       // 00:00:00 (optional)
  year: 0,        // YYYY
  month: 0,       // mm (Jan = 1, etc)
  day: 0,         // day of the month
  weekday: 0,     // week day
  hour: 0,        // 24-hr
  minute: 0,      // mm
  doy: 0,         // day of year
  workweek: 0,    // workweek number
  hasDay: false,  // if this timestamp is supposed to have a date
  hasTime: false, // if this timestamp is supposed to have a time
  past: false,    // if timestamp is in the past (based on `now` property)
  current: false, // if timestamp is current date (based on `now` property)
  future: false,  // if timestamp is in the future (based on `now` property)
  disabled: false // if timestamp is disabled
}

export const TimeObject = {
  hour: 0,  // Number
  minute: 0 // Number
}
/* eslint-enable no-multi-spaces */

export function getStartOfWeek (timestamp, weekdays, today) {
  const start = copyTimestamp(timestamp)
  if (start.day === 1 || start.weekday === 0) {
    while (!weekdays.includes(start.weekday)) {
      nextDay(start)
    }
  }
  findWeekday(start, weekdays[0], prevDay, weekdays.length)
  updateFormatted(start)
  if (today) {
    updateRelative(start, today, start.hasTime)
  }
  return start
}

export function getEndOfWeek (timestamp, weekdays, today) {
  const end = copyTimestamp(timestamp)
  // is last day of month?
  const lastDay = daysInMonth(end.year, end.month)
  if (lastDay === end.day || end.weekday === 6) {
    while (!weekdays.includes(end.weekday)) {
      prevDay(end)
    }
  }
  findWeekday(end, weekdays[weekdays.length - 1], nextDay, weekdays.length)
  updateFormatted(end)
  if (today) {
    updateRelative(end, today, end.hasTime)
  }
  return end
}

export function getStartOfMonth (timestamp) {
  const start = copyTimestamp(timestamp)
  start.day = DAY_MIN
  updateFormatted(start)
  return start
}

export function getEndOfMonth (timestamp) {
  const end = copyTimestamp(timestamp)
  end.day = daysInMonth(end.year, end.month)
  updateFormatted(end)
  return end
}

export function parseTime (input) {
  const type = Object.prototype.toString.call(input)
  switch (type) {
    case '[object Number]':
      // when a number is given, it's minutes since 12:00am
      return input
    case '[object String]':
    {
      // when a string is given, it's a hh:mm:ss format where seconds are optional
      const parts = PARSE_TIME.exec(input)
      if (!parts) {
        return false
      }
      return parseInt(parts[1], 10) * 60 + parseInt(parts[3] || 0, 10)
    }
    case '[object Object]':
      // when an object is given, it must have hour and minute
      if (typeof input.hour !== 'number' || typeof input.minute !== 'number') {
        return false
      }
      return input.hour * 60 + input.minute
  }

  return false
}

export function validateTimestamp (input) {
  return !!PARSE_REGEX.exec(input)
}

export function parsed (input) {
  // YYYY-mm-dd hh:mm:ss
  const parts = PARSE_REGEX.exec(input)

  if (!parts) return null

  return {
    date: input,
    time: '',
    year: parseInt(parts[1], 10),
    month: parseInt(parts[2], 10),
    day: parseInt(parts[4], 10) || 1,
    hour: parseInt(parts[6], 10) || 0,
    minute: parseInt(parts[8], 10) || 0,
    weekday: 0,
    doy: 0,
    workweek: 0,
    hasDay: !!parts[4],
    hasTime: !!(parts[6] && parts[8]),
    past: false,
    current: false,
    future: false,
    disabled: false
  }
}

export function parseTimestamp (input, now) {
  const timestamp = parsed(input)
  if (timestamp === null) return null

  updateFormatted(timestamp)

  if (now) {
    updateRelative(timestamp, now, timestamp.hasTime)
  }

  return timestamp
}

export function parseDate (date) {
  return updateFormatted({
    date: '',
    time: '',
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    weekday: date.getDay(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    doy: 0,
    workweek: 0,
    hasDay: true,
    hasTime: true,
    past: false,
    current: true,
    future: false,
    disabled: false
  })
}

export function getDayIdentifier (timestamp) {
  return timestamp.year * 100000000 + timestamp.month * 1000000 + timestamp.day * 10000
}

export function getTimeIdentifier (timestamp) {
  return timestamp.hour * 100 + timestamp.minute
}

export function diffTimestamp (ts1, ts2, strict) {
  const utc1 = Date.UTC(ts1.year, ts1.month - 1, ts1.day, ts1.hour, ts1.minute)
  const utc2 = Date.UTC(ts2.year, ts2.month - 1, ts2.day, ts2.hour, ts2.minute)
  if (strict === true && utc2 < utc1) {
    // Not negative number
    // utc2 - utc1 < 0  -> utc2 < utc1 ->   NO: utc1 >= utc2
    return 0
  }
  return utc2 - utc1
}

export function updateRelative (timestamp, now, time = false) {
  let a = getDayIdentifier(now)
  let b = getDayIdentifier(timestamp)
  let current = a === b

  if (timestamp.hasTime && time && current) {
    a = getTimeIdentifier(now)
    b = getTimeIdentifier(timestamp)
    current = a === b
  }

  timestamp.past = b < a
  timestamp.current = current
  timestamp.future = b > a

  return timestamp
}

export function updateMinutes (timestamp, minutes, now) {
  timestamp.hasTime = true
  timestamp.hour = Math.floor(minutes / MINUTES_IN_HOUR)
  timestamp.minute = minutes % MINUTES_IN_HOUR
  timestamp.time = getTime(timestamp)
  if (now) {
    updateRelative(timestamp, now, true)
  }

  return timestamp
}

export function updateWeekday (timestamp) {
  timestamp.weekday = getWeekday(timestamp)

  return timestamp
}

export function updateDayOfYear (timestamp) {
  timestamp.doy = getDayOfYear(timestamp)

  return timestamp
}

export function updateWorkWeek (timestamp) {
  timestamp.workweek = getWorkWeek(timestamp)

  return timestamp
}

export function updateDisabled (timestamp, disabledDays) {
  if (!Array.isArray(disabledDays) || disabledDays.length === 0) {
    return timestamp
  }
  const t = getDayIdentifier(timestamp)
  for (const day in disabledDays) {
    const d = getDayIdentifier(parseTimestamp(disabledDays[day] + ' 00:00'))
    if (d === t) {
      timestamp.disabled = true
      break
    }
  }
  return timestamp
}

export function updateFormatted (timestamp) {
  timestamp.time = getTime(timestamp)
  timestamp.date = getDate(timestamp)
  timestamp.weekday = getWeekday(timestamp)
  timestamp.doy = getDayOfYear(timestamp)
  timestamp.workweek = getWorkWeek(timestamp)

  return timestamp
}

export function getDayOfYear (timestamp) {
  if (timestamp.year === 0) return
  return (Date.UTC(timestamp.year, timestamp.month - 1, timestamp.day) - Date.UTC(timestamp.year, 0, 0)) / 24 / 60 / 60 / 1000
}

export function getWorkWeek (timestamp) {
  if (timestamp.year === 0) return
  const ts = makeDate(timestamp)
  return date.getWeekOfYear(ts)
}

export function getWeekday (timestamp) {
  if (timestamp.hasDay) {
    const floor = Math.floor
    const day = timestamp.day
    const month = ((timestamp.month + 9) % MONTH_MAX) + 1
    const century = floor(timestamp.year / 100)
    const year = (timestamp.year % 100) - (timestamp.month <= 2 ? 1 : 0)

    return (((day + floor(2.6 * month - 0.2) - 2 * century + year + floor(year / 4) + floor(century / 4)) % 7) + 7) % 7
  }

  return timestamp.weekday
}

export function isLeapYear (year) {
  return ((year % 4 === 0) ^ (year % 100 === 0) ^ (year % 400 === 0)) === 1
}

export function daysInMonth (year, month) {
  return isLeapYear(year) ? DAYS_IN_MONTH_LEAP[month] : DAYS_IN_MONTH[month]
}

export function copyTimestamp (timestamp) {
  return { ...timestamp }
}

export function padNumber (x, length) {
  let padded = String(x)
  while (padded.length < length) {
    padded = '0' + padded
  }

  return padded
}

export function getDate (timestamp) {
  let str = `${padNumber(timestamp.year, 4)}-${padNumber(timestamp.month, 2)}`

  if (timestamp.hasDay) str += `-${padNumber(timestamp.day, 2)}`

  return str
}

export function getTime (timestamp) {
  if (!timestamp.hasTime) {
    return ''
  }

  return `${padNumber(timestamp.hour, 2)}:${padNumber(timestamp.minute, 2)}`
}

export function getDateTime (timestamp) {
  return getDate(timestamp) + (timestamp.hasTime ? ' ' + getTime(timestamp) : '')
}

export function nextDay (timestamp) {
  ++timestamp.day
  timestamp.weekday = (timestamp.weekday + 1) % DAYS_IN_WEEK
  if (timestamp.day > DAYS_IN_MONTH_MIN && timestamp.day > daysInMonth(timestamp.year, timestamp.month)) {
    timestamp.day = DAY_MIN
    ++timestamp.month
    if (timestamp.month > MONTH_MAX) {
      timestamp.month = MONTH_MIN
      ++timestamp.year
    }
  }

  return timestamp
}

export function prevDay (timestamp) {
  timestamp.day--
  timestamp.weekday = (timestamp.weekday + 6) % DAYS_IN_WEEK
  if (timestamp.day < DAY_MIN) {
    timestamp.month--
    if (timestamp.month < MONTH_MIN) {
      timestamp.year--
      timestamp.month = MONTH_MAX
    }
    timestamp.day = daysInMonth(timestamp.year, timestamp.month)
  }

  return timestamp
}

export function relativeDays (timestamp, mover = nextDay, days = 1, allowedWeekdays = [0, 1, 2, 3, 4, 5, 6]) {
  while (--days >= 0) {
    mover(timestamp)
    if (allowedWeekdays.length < 7 && !allowedWeekdays.includes(timestamp.weekday)) {
      ++days
    }
  }

  return timestamp
}

export function findWeekday (timestamp, weekday, mover = nextDay, maxDays = 6) {
  while (timestamp.weekday !== weekday && --maxDays >= 0) mover(timestamp)
  return timestamp
}

export function getWeekdaySkips (weekdays) {
  const skips = [1, 1, 1, 1, 1, 1, 1]
  const filled = [0, 0, 0, 0, 0, 0, 0]
  for (let i = 0; i < weekdays.length; ++i) {
    filled[weekdays[i]] = 1
  }
  for (let k = 0; k < DAYS_IN_WEEK; ++k) {
    let skip = 1
    for (let j = 1; j < DAYS_IN_WEEK; ++j) {
      const next = (k + j) % DAYS_IN_WEEK
      if (filled[next]) {
        break
      }
      ++skip
    }
    skips[k] = filled[k] * skip
  }

  return skips
}

export function createDayList (start, end, now, weekdaySkips, disabledDays = [], max = 42, min = 0) {
  const stop = getDayIdentifier(end)
  const days = []
  let current = copyTimestamp(start)
  let currentIdentifier = 0
  let stopped = currentIdentifier === stop

  if (stop < getDayIdentifier(start)) {
    return days
  }

  while ((!stopped || days.length < min) && days.length < max) {
    currentIdentifier = getDayIdentifier(current)
    stopped = stopped || currentIdentifier > stop
    if (stopped) {
      break
    }
    if (weekdaySkips[current.weekday] === 0) {
      current = nextDay(current)
      continue
    }
    const day = copyTimestamp(current)
    updateFormatted(day)
    updateRelative(day, now)
    updateDisabled(day, disabledDays)
    days.push(day)
    // current = relativeDays(current, nextDay, weekdaySkips[current.weekday])
    current = relativeDays(current, nextDay)
  }

  return days
}

export function createIntervalList (timestamp, first, minutes, count, now) {
  const intervals = []

  for (let i = 0; i < count; ++i) {
    const mins = (first + i) * minutes
    const int = copyTimestamp(timestamp)
    intervals.push(updateMinutes(int, mins, now))
  }

  return intervals
}

export function createNativeLocaleFormatter (locale, getOptions) {
  const emptyFormatter = (_t, _s) => ''

  if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat === 'undefined') {
    return emptyFormatter
  }

  return (timestamp, short) => {
    try {
      const intlFormatter = new Intl.DateTimeFormat(locale || void 0, getOptions(timestamp, short))
      return intlFormatter.format(makeDateTime(timestamp))
    } catch (e) {
      return ''
    }
  }
}

export function makeDate (timestamp) {
  return new Date(Date.UTC(timestamp.year, timestamp.month - 1, timestamp.day, 0, 0))
}

export function makeDateTime (timestamp) {
  return new Date(Date.UTC(timestamp.year, timestamp.month - 1, timestamp.day, timestamp.hour, timestamp.minute))
}

export function validateNumber (input) {
  return isFinite(parseInt(input, 10))
}

export function isBetweenDates (timestamp, startTimestamp, endTimestamp, useTime /* = false */) {
  const cd = getDayIdentifier(timestamp) + (useTime === true ? getTimeIdentifier(timestamp) : 0)
  const sd = getDayIdentifier(startTimestamp) + (useTime === true ? getTimeIdentifier(startTimestamp) : 0)
  const ed = getDayIdentifier(endTimestamp) + (useTime === true ? getTimeIdentifier(endTimestamp) : 0)

  return cd >= sd && cd <= ed
}

export function isOverlappingDates (startTimestamp, endTimestamp, firstTimestamp, lastTimestamp) {
  const start = getDayIdentifier(startTimestamp)
  const end = getDayIdentifier(endTimestamp)
  const first = getDayIdentifier(firstTimestamp)
  const last = getDayIdentifier(lastTimestamp)
  return (
    (start >= first && start <= last) || // overlap left
    (end >= first && end <= last) || // overlap right
    (first >= start && end >= last) // surrounding
  )
}

export function addToDate (timestamp, options) {
  const ts = copyTimestamp(timestamp)
  let minType
  __forEachObject(options, (value, key) => {
    if (ts[key] !== void 0) {
      ts[key] += parseInt(value, 10)
      const indexType = NORMALIZE_TYPES.indexOf(key)
      if (indexType !== -1) {
        if (minType === void 0) {
          minType = indexType
        } else {
          minType = Math.min(indexType, minType)
        }
      }
    }
  })

  // normalize timestamp
  if (minType !== void 0) {
    __normalize(ts, NORMALIZE_TYPES[minType])
  }
  updateFormatted(ts)
  return ts
}

const NORMALIZE_TYPES = ['minute', 'hour', 'day', 'month']

// addToDate helper
function __forEachObject (obj, cb) {
  Object.keys(obj).forEach(k => cb(obj[k], k))
}

// normalize minutes
function __normalizeMinute (ts) {
  if (ts.minute >= MINUTES_IN_HOUR || ts.minute < 0) {
    const hours = Math.floor(ts.minute / MINUTES_IN_HOUR)
    ts.minute -= hours * MINUTES_IN_HOUR
    ts.hour += hours
    __normalizeHour(ts)
  }
  return ts
}

// normalize hours
function __normalizeHour (ts) {
  if (ts.hour >= HOURS_IN_DAY || ts.hour < 0) {
    const days = Math.floor(ts.hour / HOURS_IN_DAY)
    ts.hour -= days * HOURS_IN_DAY
    ts.day += days
    __normalizeDay(ts)
  }
  return ts
}

// normalize days
function __normalizeDay (ts) {
  __normalizeMonth(ts)
  let dim = daysInMonth(ts.year, ts.month)
  if (ts.day > dim) {
    ++ts.month
    if (ts.month > MONTH_MAX) {
      __normalizeMonth(ts)
    }
    let days = ts.day - dim
    dim = daysInMonth(ts.year, ts.month)
    do {
      if (days > dim) {
        ++ts.month
        if (ts.month > MONTH_MAX) {
          __normalizeMonth(ts)
        }
        days -= dim
        dim = daysInMonth(ts.year, ts.month)
      }
    } while (days > dim)
    ts.day = days
  } else if (ts.day <= 0) {
    let days = -1 * ts.day
    --ts.month
    if (ts.month <= 0) {
      __normalizeMonth(ts)
    }
    dim = daysInMonth(ts.year, ts.month)
    do {
      if (days > dim) {
        days -= dim
        --ts.month
        if (ts.month <= 0) {
          __normalizeMonth(ts)
        }
        dim = daysInMonth(ts.year, ts.month)
      }
    } while (days > dim)
    ts.day = dim - days
  }
  return ts
}

// normalize months
function __normalizeMonth (ts) {
  if (ts.month > MONTH_MAX) {
    const years = Math.floor(ts.month / MONTH_MAX)
    ts.month = ts.month % MONTH_MAX
    ts.year += years
  } else if (ts.month < MONTH_MIN) {
    ts.month += MONTH_MAX
    --ts.year
  }
  return ts
}

// normalize all
function __normalize (ts, type) {
  switch (type) {
    case 'minute':
      return __normalizeMinute(ts)
    case 'hour':
      return __normalizeHour(ts)
    case 'day':
      return __normalizeDay(ts)
    case 'month':
      return __normalizeMonth(ts)
  }
}

export function daysBetween (ts1, ts2) {
  const diff = diffTimestamp(ts1, ts2, true)
  return Math.floor(diff / MILLISECONDS_IN_DAY)
}

export function weeksBetween (ts1, ts2) {
  let t1 = copyTimestamp(ts1)
  let t2 = copyTimestamp(ts2)
  t1 = findWeekday(t1, 0)
  t2 = findWeekday(t2, 6)
  return Math.ceil(daysBetween(t1, t2) / DAYS_IN_WEEK)
}

export default {
  PARSE_REGEX,
  PARSE_TIME,
  DAYS_IN_MONTH,
  DAYS_IN_MONTH_LEAP,
  DAYS_IN_MONTH_MIN,
  DAYS_IN_MONTH_MAX,
  MONTH_MAX,
  MONTH_MIN,
  DAY_MIN,
  DAYS_IN_WEEK,
  MINUTES_IN_HOUR,
  HOURS_IN_DAY,
  FIRST_HOUR,
  MILLISECONDS_IN_DAY,
  MILLISECONDS_IN_HOUR,
  MILLISECONDS_IN_MINUTE,
  Timestamp,
  TimeObject,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  parseTime,
  validateTimestamp,
  parsed,
  parseTimestamp,
  parseDate,
  getDayIdentifier,
  getTimeIdentifier,
  diffTimestamp,
  updateRelative,
  updateMinutes,
  updateWeekday,
  updateDayOfYear,
  updateWorkWeek,
  updateDisabled,
  updateFormatted,
  getDayOfYear,
  getWorkWeek,
  getWeekday,
  isLeapYear,
  daysInMonth,
  copyTimestamp,
  padNumber,
  getDate,
  getTime,
  getDateTime,
  nextDay,
  prevDay,
  relativeDays,
  findWeekday,
  getWeekdaySkips,
  createDayList,
  createIntervalList,
  createNativeLocaleFormatter,
  makeDate,
  makeDateTime,
  validateNumber,
  isBetweenDates,
  isOverlappingDates,
  daysBetween,
  weeksBetween,
  addToDate
}
