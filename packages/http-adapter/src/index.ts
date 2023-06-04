import http = require('http');
import { IRpcAdapter, IRpcExecutor, IRpcRequest, IHttpAdapter } from '@nyth/common';


const GET = 'GET';
const POST = 'POST';
const QUERY_SEPARATOR = '?';
const API = '/api';


export interface IHttpAdapterOptions {
   readonly port: number;
}

export type IHttpAdapterConstructor = new (options: IHttpAdapterOptions) => IHttpAdapter;



export const HttpAdapter: IHttpAdapterConstructor = class HttpAdapter implements IRpcAdapter, IHttpAdapter // tslint:disable-line:no-shadowed-variable
{
   private readonly _server: http.Server;
   private readonly _options: IHttpAdapterOptions;
   private _executor: IRpcExecutor | null = null;

   constructor(options: IHttpAdapterOptions)
   {
      this._options = options;

      this._server = http.createServer(async (req, res): Promise<void> =>
      {
         if (this._executor === null) {
            res.socket?.destroy();
            return;
         }

         if (typeof req.url !== 'string') {
            res.socket?.destroy();
            return;
         }

         const [pathName, searchStr] = req.url.split(QUERY_SEPARATOR);

         if (pathName !== API) {
            res.socket?.destroy();
            return;
         }


         let rpcReq: IRpcRequest;

         switch (req.method)
         {
            case GET:
               rpcReq = Object.fromEntries(new URLSearchParams(searchStr)) as any;
               break;


            case POST:
               const chunks: Buffer[] = [];
               try {
                  for await (const chunk of req) {
                     chunks.push(chunk);
                  }
               } catch (err) {
                  console.info('Connection error!');
                  console.info(err);
                  res.writeHead(500);
                  res.end('Connection error');
                  return;
               }

               const body = Buffer.concat(chunks).toString();
               try {
                  rpcReq = JSON.parse(body);
               } catch {
                  res.writeHead(400);
                  res.end('Incorrect request body. It should be a valid json-serialized object');
                  return;
               }
               break;

            default:
               res.socket?.destroy();
               return;
         }

         const result = await this._executor(rpcReq);

         res.end(JSON.stringify(result));
         return;

      });
   }


   public async start(executor: IRpcExecutor): Promise<void>
   {
      this._executor = executor;

      return new Promise<void>((resolve, reject) => {
         try {
            this._server.listen(this._options.port, () => {
               console.info(`Server running at http://127.0.0.1:${this._options.port}/`);
               resolve();
            });
         } catch (err) {
            reject(err);
         }
      });
   }


   public async close(): Promise<void> {
      return new Promise<void>((resolve, reject): void => {
         this._server.close((err) => {
            if (err) {
               return reject(err);
            }
            resolve();
         });
      });
   }

   public adjust<T>(constructor: new (arg: { server: http.Server }) => T): T {
      return new constructor({server: this._server});
   }

   public get port(): number {
      return this._options.port;
   }
};
