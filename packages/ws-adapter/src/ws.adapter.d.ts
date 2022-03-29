import { IRpcAdapterConstructor, IHttpAdapter } from '@nyth/common';
export declare type IWebSocketAdapterOptions = {
    readonly port: number;
} | {
    readonly httpAdapter: IHttpAdapter;
};
export declare const WebSocketAdapter: IRpcAdapterConstructor<IWebSocketAdapterOptions>;
