import { BaseClient, IBaseClientOptions } from '@nyth/base-client';
import { ISerializer } from '@nyth/serializer';


export class HttpClient extends BaseClient {
   readonly #url: string;

   constructor(url: string, options?: IBaseClientOptions, serializer?: ISerializer) {
      super(options, serializer);

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
}
