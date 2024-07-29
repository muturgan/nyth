import { BaseClient, IBaseClientOptions } from '@nyth/base-client';
import { TIdGenerator } from '@nyth/models';
import { ISerializer } from '@nyth/serializer';


export class HttpClient extends BaseClient {
   readonly #url: string;

   constructor(url: string, options?: IBaseClientOptions | null, serializer?: ISerializer | null, idGenerator?: TIdGenerator | null) {
      super(options, serializer, idGenerator);

      let u: URL;
      try {
         u = new URL(url);
      } catch {
         throw new Error('[HttpClient] incorrect url');
      }

      this.#url = u.toString() + 'api';
   }

   protected transportCall(serialized: string): Promise<string> {
      return fetch(this.#url, {
         method: 'POST',
         body: serialized,
      })
      .then((stream) => stream.text());
   }

   public close(): Promise<void> {
      return Promise.resolve();
   }
}
