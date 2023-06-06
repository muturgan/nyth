import { Server as HttpServer } from 'http';
import { IRpcAdapter } from './typings';

export interface IHttpAdapter extends IRpcAdapter {
   adjust<T>(constructor: new (arg: { server: HttpServer }) => T): T;
   close(): Promise<void>;
   readonly port: number;
}
