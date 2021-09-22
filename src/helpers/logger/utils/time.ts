import moment from 'moment';

/**
 * Строка для логирования времени через moment
 * @returns string
 */
const time = (unixTime: number): string => moment(unixTime).format('HH:mm:ss.SSS');

export default time;
