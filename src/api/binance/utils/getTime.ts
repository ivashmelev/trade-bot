import Sntp from '@hapi/sntp';

/**
 * Фунция вычисляет параметр timestamp для запросов к бирже
 */
const getTime = async (): Promise<number> => {
  const time = await Sntp.time();
  const offset = parseInt(time.t, 10);
  return Date.now() + offset;
};

export default getTime;
