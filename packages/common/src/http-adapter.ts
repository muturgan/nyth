import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { IRpcAdapter } from './typings';

export interface IHttpAdapter extends IRpcAdapter {
   adjust<T>(constructor: new (arg: { server: HttpServer | HttpsServer }) => T): T;
   close(): Promise<void>;
   readonly port: number;
}
