import { Factory } from './application.factory';
import { lengthHandler } from './handler';
import { HttpAdapter } from './http.adapter';
import { IRouting } from './typings';

const httpAdapter = new HttpAdapter({port: 3333});

const routing: IRouting = {
   getLength: lengthHandler as any,
};

const app = Factory(routing, httpAdapter);
app.start().then(() => setTimeout(() => {
   app.stop();
}, 5000));
