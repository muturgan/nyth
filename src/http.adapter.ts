import http = require('http');
import qs = require('querystring');
import { IRpcAdapter, IRpcAdapterConstructor, IRpcListener } from './typings';


const GET = 'GET';
const POST = 'POST';
const QUERY_SEPARATOR = '?';
const API = '/api';


export interface IHttpAdapterOptions {
   readonly port: number;
}



export const HttpAdapter: IRpcAdapterConstructor<IHttpAdapterOptions> = class HttpAdapter implements IRpcAdapter
{
   private readonly _server: http.Server;
   private readonly _options: IHttpAdapterOptions;
   private readonly _handler: IRpcListener | null = null;

   constructor(options: IHttpAdapterOptions)
   {
      this._options = options;

      this._server = http.createServer(async (req, res): Promise<void> =>
      {
         if (this._handler === null) {
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


         let rpcReq: Record<string, unknown>;

         switch (req.method)
         {
            case GET:
               rpcReq = {...qs.parse(searchStr)};
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

         const result = await this._handler(rpcReq as any);

         res.end(JSON.stringify(result));
         return;

      });
   }


   public async start(handler: IRpcListener): Promise<void> {
      // @ts-ignore
      this._handler = handler;

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
};