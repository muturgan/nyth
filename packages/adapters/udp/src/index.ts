import { createSocket, Socket as UdpSocket } from 'node:dgram';
import { BaseAdapter } from '@nyth/base-adapter';
import { ISerializer } from '@nyth/serializer';
import { IRpcAdapter, IRpcExecutor, IRpcAdapterConstructor } from '@nyth/common';
import { IRpcRequest, SystemErrorResult } from '@nyth/models';


export interface IUdpAdapterOptions {
   readonly port: number;
}


export const UdpAdapter: IRpcAdapterConstructor<IUdpAdapterOptions> = class Udpdapter extends BaseAdapter implements IRpcAdapter // tslint:disable-line:no-shadowed-variable
{
   readonly #socket: UdpSocket;
   readonly #port: number;
   #executor: IRpcExecutor | null = null;

   constructor(options: IUdpAdapterOptions, serializer?: ISerializer)
   {
      super(serializer);

      const port = options?.port;

      if (!port || typeof port !== 'number' || port < 1 || port > 9999 || port % 1 !== 0) {
         throw new Error('[UdpAdapter] Incorrect port value');
      }
      this.#port = port;

      this.#socket = createSocket('udp4');

      this.#socket.on('message', async (buf, rinfo) => {
         if (this.#executor === null) {
            await this.close();
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
               this.#socket.send(serializedR1, rinfo.port, rinfo.address);
               return;
            } catch {
               this.#socket.send(errMessage1, rinfo.port, rinfo.address);
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
               this.#socket.send(serializedR2, rinfo.port, rinfo.address);
               return;
            } catch {
               this.#socket.send(errMessage2, rinfo.port, rinfo.address);
               return;
            }
         }

         this.#socket.send(serializedResult, rinfo.port, rinfo.address);
         return;
      });
   }


   public async start(executor: IRpcExecutor): Promise<void>
   {
      this.#executor = executor;

      return new Promise<void>((resolve, reject) => {
         try {
            this.#socket.once('listening', () => {
               const address = this.#socket.address();
               console.info(`UDP server listening on port ${address.port}`);
               resolve();
            });

            this.#socket.bind(this.#port);
         } catch (err) {
            reject(err);
         }
      });
   }


   public async close(): Promise<void> {
      return new Promise<void>((resolve): void => {
         this.#socket.close(() => {
            resolve();
         });
      });
   }

   public get port(): number {
      return this.#port;
   }
};
