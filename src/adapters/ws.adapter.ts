import { WebSocketServer } from 'ws';
import { IRpcAdapter, IRpcAdapterConstructor, IRpcExecutor, IRpcRequest } from '../typings';


export interface IWebSocketAdapterOptions {
   readonly port: number;
}


export const WebSocketAdapter: IRpcAdapterConstructor<IWebSocketAdapterOptions> = class WebSocketAdapter implements IRpcAdapter
{
   private _server: WebSocketServer | null = null;
   private readonly _options: IWebSocketAdapterOptions;

   constructor(options: IWebSocketAdapterOptions) {
      this._options = options;
   }

   public start(executor: IRpcExecutor): void
   {
      this._server = new WebSocketServer({ port: this._options.port });
      console.info(`WebSocket server running at http://127.0.0.1:${this._options.port}`);

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
};
