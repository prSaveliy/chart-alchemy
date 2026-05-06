import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'INFO' | 'DEBUG' | 'ERROR';

interface LogOptions {
  level?: LogLevel;
  logToConsole?: boolean;
  logToFile?: boolean;
}

export function log(
  options: LogOptions = { level: 'INFO', logToConsole: true, logToFile: false },
) {
  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = String(context.name);
    const targetLevel = options.level || 'INFO';

    return function (this: unknown, ...args: unknown[]) {
      const start = Date.now();
      const timestamp = new Date().toISOString();

      const processLog = (result: unknown, error?: Error) => {
        const duration = Date.now() - start;

        if (targetLevel === 'ERROR' && !error) return;

        const isDebug = targetLevel === 'DEBUG';

        const logData = {
          timestamp,
          level: targetLevel,
          method: methodName,
          status: error ? 'FAILED' : 'SUCCESS',
          args: args,
          result: error ? undefined : result,
          error: error ? error.message : undefined,
          duration: `${duration}ms`,
        };

        if (options.logToConsole) {
          console.log(
            `[${logData.timestamp}] [${logData.level}] ${logData.method} - ${logData.status} (${logData.duration})`,
          );
          if (isDebug)
            console.debug('Debug Payload:', JSON.stringify(logData, null, 2));
        }

        if (options.logToFile) {
          const filePath = path.join(
            process.cwd(),
            'src/utils/logger/logs.log',
          );
          const fileEntry = JSON.stringify(logData) + '\n\n';

          fs.appendFile(filePath, fileEntry, err => {
            if (err) console.error('Failed to write to log file:', err);
          });
        }
      };

      try {
        const result = originalMethod.apply(this, args);

        if (result instanceof Promise) {
          return result
            .then(val => {
              processLog(val);
              return val;
            })
            .catch(err => {
              processLog(undefined, err);
              throw err;
            });
        }

        processLog(result);
        return result;
      } catch (error) {
        processLog(undefined, error as Error);
        throw error;
      }
    };
  };
}
