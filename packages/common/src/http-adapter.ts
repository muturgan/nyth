import { Server } from 'http';
import { IRpcAdapter } from './typings';

export interface IHttpAdapter extends IRpcAdapter {
   adjust<T>(constructor: new (arg: { server: Server }) => T): T;
   close(): Promise<void>;
   readonly port: number;
}