import { AsyncClient, IBaseClientOptions } from '@nyth/base-client';
import { TIdGenerator } from '@nyth/models';
import { ISerializer } from '@nyth/serializer';

const WebSocket = globalThis.WebSocket || require('ws').WebSocket;


export class WsClient extends AsyncClient {

   readonly #ws: WebSocket;

   constructor(url: string, options?: IBaseClientOptions | null, serializer?: ISerializer | null, idGenerator?: TIdGenerator | null) {
      super(options, serializer, idGenerator);

      let u: URL;
      try {
         u = new URL(url);
      } catch {
         throw new Error('[WsClient] incorrect url');
      }

      this.#ws = new WebSocket(u);

      this.#ws.onmessage = ({ data }) => {
         this.emit(data.toString());
      };
   }

   protected transportCall(serialized: string, requestId: string | number): Promise<''> {
      return new Promise<''>((resolve, _reject) => {
         this.#ws.send(serialized);
         resolve('');
      });
   }

   public close(): Promise<void> {
      return new Promise<void>((resolve) => {
         this.#ws.close(1, '');
         resolve();
      });
   }
}
