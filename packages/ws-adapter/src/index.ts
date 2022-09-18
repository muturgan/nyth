import { WebSocketServer } from 'ws';
import { IRpcAdapter, IRpcAdapterConstructor, IRpcExecutor, IRpcRequest, IHttpAdapter } from '@nyth/common';


export type IWebSocketAdapterOptions = {
   readonly port: number;
} | {
   readonly httpAdapter: IHttpAdapter;
};


export const WebSocketAdapter: IRpcAdapterConstructor<IWebSocketAdapterOptions> = class WebSocketAdapter implements IRpcAdapter // tslint:disable-line:no-shadowed-variable
{
   private _server: WebSocketServer | null = null;
   private _httpAdapter: IHttpAdapter | null = null;
   private readonly _options: IWebSocketAdapterOptions;

   constructor(options: IWebSocketAdapterOptions) {
      this._options = options;
   }

   public async start(executor: IRpcExecutor): Promise<void>
   {
      if ('httpAdapter' in this._options) {
         this._httpAdapter = this._options.httpAdapter;
         await this._httpAdapter.start(executor);
         this._server = this._httpAdapter.adjust(WebSocketServer);
         console.info(`WebSocket server running at http://127.0.0.1:${this._httpAdapter.port}`);
      }
      else {
         this._server = new WebSocketServer({ port: this._options.port });
         console.info(`WebSocket server running at http://127.0.0.1:${this._options.port}`);
      }

      this._server.on('connection', (ws) => {
         ws.on('message', async (rawData): Promise<void> => {
            let rpcReq: IRpcRequest;
            try {
               rpcReq = JSON.parse(rawData.toString());
            } catch {
               ws.send('Error...');
               return;
            }

            const result = await executor(rpcReq);
            ws.send(JSON.stringify(result));
         });
      });
   }

   public async close(): Promise<void> {
      await Promise.all([
         this._closeWs(),
         this._closeHttp(),
      ]);
   }

   private _closeWs(): Promise<void> {
      return new Promise<void>((resolve, reject): void => {
         if (this._server === null) {
            return resolve();
         }

         this._server.close((err) => {
            if (err) {
               return reject(err);
            }
            resolve();
         });
      });
   }

   private _closeHttp(): Promise<void> {
      return this._httpAdapter === null
         ? Promise.resolve()
         : this._httpAdapter.close();
   }
};
