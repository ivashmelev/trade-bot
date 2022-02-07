export const getEnviromentVariable = (env?: string): string => {
  if (env) {
    return env;
  } else {
    throw Error('Нет переменной окружения');
  }
};
