import { WebSocketServer } from 'ws';
import { IRpcAdapter, IRpcAdapterConstructor, IRpcExecutor, IRpcRequest, IHttpAdapter } from '@nyth/common';


export type IWebSocketAdapterOptions = {
   readonly port: number;
} | {
   readonly httpAdapter: IHttpAdapter;
};


export const WebSocketAdapter: IRpcAdapterConstructor<IWebSocketAdapterOptions> = class WebSocketAdapter implements IRpcAdapter // tslint:disable-line:no-shadowed-variable
{
   #server: WebSocketServer | null = null;
   #httpAdapter: IHttpAdapter | null = null;
   readonly #options: IWebSocketAdapterOptions;

   constructor(options: IWebSocketAdapterOptions) {
      this.#options = options;
   }

   public async start(executor: IRpcExecutor): Promise<void>
   {
      if ('httpAdapter' in this.#options) {
         this.#httpAdapter = this.#options.httpAdapter;
         await this.#httpAdapter.start(executor);
         this.#server = this.#httpAdapter.adjust(WebSocketServer);
         console.info(`WebSocket server running at http://127.0.0.1:${this.#httpAdapter.port}`);
      }
      else {
         this.#server = new WebSocketServer({ port: this.#options.port });
         console.info(`WebSocket server running at http://127.0.0.1:${this.#options.port}`);
      }

      this.#server.on('connection', (ws) => {
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
         this.#closeWs(),
         this.#closeHttp(),
      ]);
   }

   #closeWs(): Promise<void> {
      return new Promise<void>((resolve, reject): void => {
         if (this.#server === null) {
            return resolve();
         }

         this.#server.close((err) => {
            if (err) {
               return reject(err);
            }
            resolve();
         });
      });
   }

   #closeHttp(): Promise<void> {
      return this.#httpAdapter === null
         ? Promise.resolve()
         : this.#httpAdapter.close();
   }
};
