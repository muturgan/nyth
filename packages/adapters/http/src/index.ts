import { Server as HttpServer, createServer as createHttpServer, IncomingMessage, ServerResponse } from 'http';
import { Server as HttpsServer, createServer as createHttpsServer, ServerOptions } from 'https';
import { BaseAdapter } from '@nyth/base-adapter';
import { ISerializer } from '@nyth/serializer';
import { IRpcAdapter, IRpcExecutor, IHttpAdapter } from '@nyth/common';
import { IRpcRequest, SystemErrorResult } from '@nyth/models';


const GET = 'GET';
const POST = 'POST';
const QUERY_SEPARATOR = '?';
const API = '/api';


export interface IHttpAdapterOptions {
   readonly port: number;
   readonly listenAllPorts?: boolean;
   readonly secureContext?: {
      readonly key: string | Buffer,
      readonly cert: string | Buffer,
   };
}

export type IHttpAdapterConstructor = new (options: IHttpAdapterOptions) => IHttpAdapter;



export const HttpAdapter: IHttpAdapterConstructor = class HttpAdapter extends BaseAdapter implements IRpcAdapter, IHttpAdapter // tslint:disable-line:no-shadowed-variable
{
   readonly #server: HttpServer | HttpsServer;
   readonly #host: string;
   readonly #port: number;
   #executor: IRpcExecutor | null = null;

   constructor(options: IHttpAdapterOptions, serializer?: ISerializer)
   {
      super(serializer);

      const port = options?.port;

      if (!port || typeof port !== 'number' || port < 1 || port > 9999 || port % 1 !== 0) {
         throw new Error('[HttpAdapter] Incorrect port value');
      }
      this.#port = port;

      this.#host = options?.listenAllPorts === true ? '0.0.0.0' : '127.0.0.1';

      const serverOptions: ServerOptions = {};
      if (options?.secureContext) {
         if (!options.secureContext?.key?.length || !options.secureContext?.cert?.length) {
            throw new Error('[HttpAdapter] Incorrect security context');
         }
         serverOptions.key = options.secureContext?.key;
         serverOptions.cert = options.secureContext?.cert;
      }

      type TCreateServer = (options: ServerOptions, requestListener: (req: IncomingMessage, res: ServerResponse) => Promise<void>) => HttpServer | HttpsServer;
      const createServer: TCreateServer = options?.secureContext ? createHttpsServer : createHttpServer;

      this.#server = createServer(serverOptions, async (req, res): Promise<void> =>
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
                  rpcReq = this.serializer.deserialize<IRpcRequest>(body);
               } catch (err) {
                  const errMessage1 = `Error on RPC request deserialization: ${(err as Error)?.message}`;
                  // @ts-ignore
                  const r1 = new SystemErrorResult(rpcReq, errMessage1);

                  let serializedR1: string;
                  try {
                     serializedR1 = this.serializer.serialize(r1);
                     res.end(serializedR1);
                     return;
                  } catch {
                     res.writeHead(500);
                     res.end(errMessage1);
                     return;
                  }
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
         } catch (err) {
            const errMessage2 = `Error on RPC result serialization: ${(err as Error)?.message}`;
            const r2 = new SystemErrorResult(rpcReq, errMessage2);

            let serializedR2: string;
            try {
               serializedR2 = this.serializer.serialize(r2);
               res.end(serializedR2);
               return;
            } catch {
               res.writeHead(500);
               res.end(errMessage2);
               return;
            }
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
            this.#server.listen(this.#port, this.#host, () => {
               console.info(`Server running at http://127.0.0.1:${this.#port}/`);
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

   public adjust<T>(constructor: new (arg: { server: HttpServer }) => T): T {
      return new constructor({server: this.#server});
   }

   public get port(): number {
      return this.#port;
   }
};