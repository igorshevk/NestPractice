import * as winston from 'winston';
import 'winston-daily-rotate-file';

export default () => {
  const winstonCf = {
    level: 'info',
    format: winston.format.json(),
  };
  const rotateCf = {
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  };

  if (process.env.AWS) {
    return {
      winston: {
        ...winstonCf,
        transports: [new winston.transports.Console()],
      },
    };
  }
  if (process.env.NODE_ENV !== 'production') {
    return {
      winston: {
        ...winstonCf,
        level: 'debug',
        transports: [
          new winston.transports.Console(),
          new winston.transports.DailyRotateFile({
            ...rotateCf,
            filename: 'logs/error-%DATE%.log',
            level: 'error',
          }),
          new winston.transports.DailyRotateFile({
            ...rotateCf,
            filename: 'logs/combined-%DATE%.log',
          }),
        ],
      },
    };
  } else {
    return {
      winston: {
        ...winstonCf,
        transports: [
          new winston.transports.DailyRotateFile({
            ...rotateCf,
            filename: 'logs/error-%DATE%.log',
            level: 'error',
          }),
          new winston.transports.DailyRotateFile({
            ...rotateCf,
            filename: 'logs/combined-%DATE%.log',
          }),
        ],
      },
    };
  }
};
