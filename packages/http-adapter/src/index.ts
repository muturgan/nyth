import http = require('http');
import { BaseAdapter, ISerializer, IRpcAdapter, IRpcExecutor, IRpcRequest, IHttpAdapter } from '@nyth/common';


const GET = 'GET';
const POST = 'POST';
const QUERY_SEPARATOR = '?';
const API = '/api';


export interface IHttpAdapterOptions {
   readonly port: number;
}

export type IHttpAdapterConstructor = new (options: IHttpAdapterOptions) => IHttpAdapter;



export const HttpAdapter: IHttpAdapterConstructor = class HttpAdapter extends BaseAdapter implements IRpcAdapter, IHttpAdapter // tslint:disable-line:no-shadowed-variable
{
   readonly #server: http.Server;
   readonly #options: IHttpAdapterOptions;
   #executor: IRpcExecutor | null = null;

   constructor(options: IHttpAdapterOptions, serializer?: ISerializer)
   {
      super(serializer);

      this.#options = options;

      this.#server = http.createServer(async (req, res): Promise<void> =>
      {
         if (this.#executor === null) {
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
                  rpcReq = this.serializer.deserialize(body);
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

         const result = await this.#executor(rpcReq);

         let serializedResult: string;
         try {
            serializedResult = this.serializer.serialize(result);
         } catch {
            res.writeHead(500);
            res.end('Error on response serialisation');
            return;
         }

         res.end(serializedResult);
         return;

      });
   }


   public async start(executor: IRpcExecutor): Promise<void>
   {
      this.#executor = executor;

      return new Promise<void>((resolve, reject) => {
         try {
            this.#server.listen(this.#options.port, () => {
               console.info(`Server running at http://127.0.0.1:${this.#options.port}/`);
               resolve();
            });
         } catch (err) {
            reject(err);
         }
      });
   }


   public async close(): Promise<void> {
      return new Promise<void>((resolve, reject): void => {
         this.#server.close((err) => {
            if (err) {
               return reject(err);
            }
            resolve();
         });
      });
   }

   public adjust<T>(constructor: new (arg: { server: http.Server }) => T): T {
      return new constructor({server: this.#server});
   }

   public get port(): number {
      return this.#options.port;
   }
};
