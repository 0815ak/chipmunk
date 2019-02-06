import Logger from './env.logger';
import { list } from 'serialport';
import * as SerialPort from 'serialport';

class Application {

    private _logger: Logger = new Logger('Application');

    constructor() {
        if (process.send === void 0) {
            throw new Error(`Fail to init plugin, because IPC interface isn't available`);
        }
        process.on('message', (...args: any[]) => {
            console.log(args);
            this._logger.env(`This is good`);
            // process.send !== void 0 && process.send('HEY!');
        });
        process.send('Try to open list!');
        try {
            list().then((ports: SerialPort.PortInfo[]) => {
                console.log(ports);
                process.send !== void 0 && process.send(ports);
            }).catch((error: Error) => {
                console.log(error);
                process.send !== void 0 && process.send(error);
            });
        } catch (e) {
            process.send(e);
        }
        process.send('Hey!');
    }

}

const app: Application = new Application();
setTimeout(() => {
    console.log('q');
}, 4000);

setInterval(() => {
    console.log('ping!');
}, 1000);

console.log('HEY!!!!!!!!');
