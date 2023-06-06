import { RpcRequest, IRpcRequestOptions, IRpcResult } from '@nyth/models';
import { defaultSerializer, ISerializer } from '@nyth/serializer';


export interface IBaseClientOptions {
   readonly withCorrelationId?: boolean;
   readonly withRequestId?: boolean;
   readonly withTimestamp?: boolean;
}


export abstract class BaseClient {

   readonly #options?: IBaseClientOptions;
   readonly #serializer: ISerializer;

   constructor(options?: IBaseClientOptions, serializer?: ISerializer) {
      this.#options = options;
      this.#serializer = serializer || defaultSerializer;
   }

   protected abstract transportCall(serialized: string): Promise<string>;

   public async rpcCall<ResPayload, ReqPayload>(method: string, payload: ReqPayload, requestId?: string | number, correlationId?: string | number): Promise<IRpcResult<ResPayload>> {
      const req = BaseClient.#createRpcRequest(method, payload, this.#options, requestId, correlationId);
      const serialized = this.#serializer.serialize(req);

      const res = await this.transportCall(serialized);

      return this.#serializer.deserialize<IRpcResult<ResPayload>>(res);
   }

   static #createRpcRequest<Payload>(method: string, payload: Payload, clientOptions?: IBaseClientOptions, requestId?: string | number, correlationId?: string | number): RpcRequest<Payload> {
      const reqOptions: IRpcRequestOptions = {};

      if (requestId) {
         reqOptions.requestId = requestId;
      }
      else if (clientOptions?.withRequestId) {
         reqOptions.withRequestId = clientOptions.withRequestId;
      }

      if (correlationId) {
         reqOptions.correlationId = correlationId;
      }
      else if (clientOptions?.withCorrelationId) {
         reqOptions.withCorrelationId = clientOptions.withCorrelationId;
      }

      if (clientOptions?.withTimestamp) {
         reqOptions.withTimestamp = clientOptions.withTimestamp;
      }

      return new RpcRequest(method, payload, reqOptions);
   }
}
