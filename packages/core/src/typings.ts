import { IRouting, IRpcAdapter } from '@nyth/common';

export interface IApplication {
   start(): Promise<void>;
   stop(): Promise<void>;
}
export type TApplicationFactory = (handlers: IRouting, adapter: IRpcAdapter) => IApplication | never;
