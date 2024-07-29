import { createSocket as createUdpSocket, Socket as UdpSocket } from 'node:dgram';
import { AsyncClient, IBaseClientOptions } from '@nyth/base-client';
import { TIdGenerator } from '@nyth/models';
import { ISerializer } from '@nyth/serializer';


export class UdpClient extends AsyncClient {
   readonly #host: string;
   readonly #port: number;
   readonly #socket: UdpSocket;

   constructor(port: number, host: string, options?: IBaseClientOptions | null, serializer?: ISerializer | null, idGenerator?: TIdGenerator | null) {
      super(options, serializer, idGenerator);

      try {
         new URL(`udp://${host}:${port}`); // tslint:disable-line:no-unused-expression
      } catch {
         throw new Error('[UdpClient] incorrect host or port');
      }
      this.#host = host;
      this.#port = port;

      this.#socket = createUdpSocket('udp4');

      this.#socket.on('message', (data, _info) => {
         this.emit(data.toString());
      });

      this.#socket.on('error', (err) => {
         console.error('[UdpClient] socket error', err);
      });
   }

   protected transportCall(serialized: string, requestId: string | number): Promise<''> {
      return new Promise<''>((resolve, reject) => {
         this.#socket.send(serialized, this.#port, this.#host, (err) => {
            if (err) {
               delete this.promises[requestId];
               return reject(err);
            }
            resolve('');
         });
      });
   }

   public close(): Promise<void> {
      return new Promise<void>((resolve) => {
         this.#socket.close(() => {
            resolve();
         });
      });
   }
}
