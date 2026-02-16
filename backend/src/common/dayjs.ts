import * as dayjs from 'dayjs';
import utc = require('dayjs/plugin/utc');
import timezone = require('dayjs/plugin/timezone');
import customParseFormat = require('dayjs/plugin/customParseFormat');
import duration = require('dayjs/plugin/duration');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(duration);

dayjs.tz.setDefault('UTC');

export { dayjs };