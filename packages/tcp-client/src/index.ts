import { Socket } from 'node:net';
import { BaseClient, IBaseClientOptions } from '@nyth/base-client';
import { TIdGenerator } from '@nyth/models';
import { ISerializer } from '@nyth/serializer';


export class TcpClient extends BaseClient {
   readonly #host: string;
   readonly #port: number;

   constructor(port: number, host: string, options?: IBaseClientOptions | null, serializer?: ISerializer | null, idGenerator?: TIdGenerator | null) {
      super(options, serializer, idGenerator);

      try {
         new URL(`tcp://${host}:${port}`); // tslint:disable-line:no-unused-expression
      } catch {
         throw new Error('[TcpClient] incorrect host or port');
      }
      this.#host = host;
      this.#port = port;
   }

   protected transportCall(serialized: string): Promise<string> {
      return new Promise<string>((resolve, reject) => {
         const client = new Socket();

         client.on('data', (data) => {
            client.destroy();
            resolve(data.toString());
         });

         client.on('error', (err) => {
            client.destroy();
            reject(err);
         });

         client.connect(this.#port, this.#host, () => {
            client.write(serialized);
         });
      });
   }
}
