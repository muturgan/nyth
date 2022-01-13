import { Factory } from './application.factory';
import { lengthHandler } from './handler';
import { HttpAdapter } from './adapters/http.adapter';
import { WebSocketAdapter } from './adapters/ws.adapter';
import { IRouting } from './typings';

const httpAdapter = new HttpAdapter({port: 3333});
const wsAdapter = new WebSocketAdapter({httpAdapter: httpAdapter});

const routing: IRouting = {
   getLength: lengthHandler as any,
};

const app = Factory(routing, wsAdapter);
app.start().then(() => setTimeout(() => {
   app.stop();
}, 20000));
