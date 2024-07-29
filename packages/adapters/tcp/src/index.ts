import { Server as TcpServer, createServer as createTcpServer, Socket as TcpSocket } from 'node:net';
import { Server as TlsServer, createServer as createTlsServer, TLSSocket, TlsOptions } from 'node:tls';
import { BaseAdapter } from '@nyth/base-adapter';
import { ISerializer } from '@nyth/serializer';
import { IRpcAdapter, IRpcExecutor, IRpcAdapterConstructor } from '@nyth/common';
import { IRpcRequest, SystemErrorResult } from '@nyth/models';


export interface ITcpAdapterOptions {
   readonly port: number;
   readonly listenAllHosts?: boolean;
   readonly secureContext?: {
      readonly key: string | Buffer,
      readonly cert: string | Buffer,
   };
}


export const TcpAdapter: IRpcAdapterConstructor<ITcpAdapterOptions> = class TcpAdapter extends BaseAdapter implements IRpcAdapter // tslint:disable-line:no-shadowed-variable
{
   readonly #server:  TcpServer | TlsServer;
   readonly #host: string;
   readonly #port: number;
   #executor: IRpcExecutor | null = null;

   constructor(options: ITcpAdapterOptions, serializer?: ISerializer)
   {
      super(serializer);

      const port = options?.port;

      if (!port || typeof port !== 'number' || port < 1 || port > 9999 || port % 1 !== 0) {
         throw new Error('[TcpAdapter] Incorrect port value');
      }
      this.#port = port;

      this.#host = options?.listenAllHosts === true ? '0.0.0.0' : '127.0.0.1';

      const serverOptions: TlsOptions = {};
      if (options?.secureContext) {
         if (!options.secureContext?.key?.length || !options.secureContext?.cert?.length) {
            throw new Error('[TcpAdapter] Incorrect security context');
         }
         serverOptions.key = options.secureContext.key;
         serverOptions.cert = options.secureContext.cert;
      }

      type TCreateServer = (options: TlsOptions, connectionListener: (socket: TcpSocket | TLSSocket) => void) => TcpServer | TlsServer;
      const createServer: TCreateServer = options?.secureContext ? createTlsServer : createTcpServer;

      this.#server = createServer(serverOptions, (socket): void =>
      {
         socket.on('data', async (buf) => {
            if (this.#executor === null) {
               socket?.destroy();
               return;
            }

            let rpcReq: IRpcRequest;

            try {
               const body = buf.toString();
               rpcReq = this.serializer.deserialize<IRpcRequest>(body);
            }
            catch (err) {
               const errMessage1 = `Error on RPC request deserialization: ${(err as Error)?.message}`;
               // @ts-ignore
               const r1 = new SystemErrorResult(rpcReq, errMessage1);

               let serializedR1: string;
               try {
                  serializedR1 = this.serializer.serialize(r1);
                  socket.end(serializedR1);
                  return;
               } catch {
                  socket.end(errMessage1);
                  return;
               }
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
                  socket.end(serializedR2);
                  return;
               } catch {
                  socket.end(errMessage2);
                  return;
               }
            }

            socket.end(serializedResult);
            return;
         });

      });
   }


   public async start(executor: IRpcExecutor): Promise<void>
   {
      this.#executor = executor;

      return new Promise<void>((resolve, reject) => {
         try {
            this.#server.listen(this.#port, this.#host, () => {
               console.info(`TCP Server running on port ${this.#port}`);
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

   public get port(): number {
      return this.#port;
   }
};
