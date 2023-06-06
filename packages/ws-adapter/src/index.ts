import { WebSocketServer } from 'ws';
import { BaseAdapter, ISerializer, IRpcAdapter, IRpcAdapterConstructor, IRpcExecutor, IRpcRequest, IHttpAdapter } from '@nyth/common';


export type IWebSocketAdapterOptions = {
   readonly port: number;
   readonly listenAllPorts?: boolean
} | {
   readonly httpAdapter: IHttpAdapter;
};


export const WebSocketAdapter: IRpcAdapterConstructor<IWebSocketAdapterOptions> = class WebSocketAdapter extends BaseAdapter implements IRpcAdapter // tslint:disable-line:no-shadowed-variable
{
   #server: WebSocketServer | null = null;
   #httpAdapter: IHttpAdapter | null = null;
   readonly #options: IWebSocketAdapterOptions;

   constructor(options: IWebSocketAdapterOptions, serializer?: ISerializer) {
      super(serializer);

      if ('port' in options) {
         const port = options.port;
         if (!port || typeof port !== 'number' || port < 1 || port > 9999 || port % 1 !== 0) {
            throw new Error('[WebSocketAdapter] Incorrect port value');
         }
      }

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
         const host = this.#options?.listenAllPorts === true ? '0.0.0.0' : '127.0.0.1';
         this.#server = new WebSocketServer({ host, port: this.#options.port });
         console.info(`WebSocket server running at http://127.0.0.1:${this.#options.port}`);
      }

      this.#server.on('connection', (ws) => {
         ws.on('message', async (rawData): Promise<void> => {
            let rpcReq: IRpcRequest;
            try {
               rpcReq = this.serializer.deserialize(rawData.toString());
            } catch {
               ws.send('Error...');
               return;
            }

            const result = await executor(rpcReq);
            let serializedResult: string;
            try {
               serializedResult = this.serializer.serialize(result);
            } catch {
               ws.send('Error on response serialisation...');
               return;
            }
            ws.send(serializedResult);
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
