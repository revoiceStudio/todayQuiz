const { addColors, createLogger, format, transports } =  require('winston')
require('winston-daily-rotate-file')
const fs = require('fs')
const logDir ='./log'
const env = process.env.NODE_ENV

exports.log = function (info){

  if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
  }

  addColors({
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'green'
  });

  const dailyRotateFileTransport = new transports.DailyRotateFile({
    level: env === "development" ? "debug" : "info",
    filename: `${logDir}/%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d"
  })
  
  const logger = createLogger({
    level: env === "development" ? "debug" : "info",
    format: format.combine(
      format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss"
      }),
      format.json()
    ),
    transports: [
      new transports.Console({
        level: env === "development" ? "debug" : "info",
        format: format.combine(
          format.colorize({ all: true }),
          format.printf(
            info => `${info.timestamp} ${info.level}: ${info.message}`
          )
        )
      }),
      dailyRotateFileTransport
    ]
  })
  
  try{
    if(env=="production"){
      logger.info(info);
    }else{
      logger.debug(info);
    }
  }catch(exception){
    logger.error("ERROR=>" +exception);
  }
}
