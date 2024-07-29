import { RpcRequest, IRpcRequestOptions, IRpcResult, TIdGenerator, IRpcRequest } from '@nyth/models';
import { defaultSerializer, ISerializer } from '@nyth/serializer';


export interface IBaseClientOptions {
   readonly withCorrelationId?: boolean;
   readonly withRequestId?: boolean;
   readonly withTimestamp?: boolean;
}

export type RPSignature<ReqPayload = unknown, ResPayload = unknown> = [ReqPayload, ResPayload];


export abstract class BaseClient {
   public get ASYNC(): boolean {
      return false;
   }

   readonly #options?: IBaseClientOptions | null;
   readonly #serializer: ISerializer;
   readonly #idGenerator?: TIdGenerator | null;

   constructor(options?: IBaseClientOptions | null, serializer?: ISerializer | null, idGenerator?: TIdGenerator | null) {
      this.#options = options;
      this.#serializer = serializer || defaultSerializer;
      this.#idGenerator = idGenerator;
   }

   protected abstract transportCall(serialized: string, requestId?: string | number): Promise<string>;

   public async rpcCall<ResPayload, ReqPayload>(method: string, payload: ReqPayload, requestId?: string | number, correlationId?: string | number): Promise<IRpcResult<ResPayload>> {
      const req = this.createRpcRequest(method, payload, requestId, correlationId);
      const serialized = this.serialize(req);

      const res = await this.transportCall(serialized, requestId);

      return this.deserialize<IRpcResult<ResPayload>>(res);
   }

   public async rpcCallWithChain<ResPayload, ReqPayload>(chainReq: IRpcRequest, method: string, payload: ReqPayload, requestId?: string | number, correlationId?: string | number): Promise<IRpcResult<ResPayload>> {
      const req = this.createRpcRequestForChain(chainReq, method, payload, requestId, correlationId);
      const serialized = this.serialize(req);

      const res = await this.transportCall(serialized, requestId);

      return this.deserialize<IRpcResult<ResPayload>>(res);
   }

   static #createRpcRequest<Payload>(method: string, payload: Payload, clientOptions?: IBaseClientOptions | null, idGenerator?: TIdGenerator | null, requestId?: string | number, correlationId?: string | number): RpcRequest<Payload> {
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

      return new RpcRequest(method, payload, reqOptions, idGenerator);
   }

   protected createRpcRequest<Payload>(method: string, payload: Payload, requestId?: string | number, correlationId?: string | number): RpcRequest<Payload> {
      return BaseClient.#createRpcRequest(method, payload, this.#options, this.#idGenerator, requestId, correlationId);
   }

   static #createRpcRequestForChain<Payload>(chainReq: IRpcRequest, method: string, payload: Payload, clientOptions?: IBaseClientOptions | null, idGenerator?: TIdGenerator | null, requestId?: string | number, correlationId?: string | number): RpcRequest<Payload> {
      const reqOptions: IRpcRequestOptions = {};

      if (requestId) {
         reqOptions.requestId = requestId;
      }
      else if (chainReq?.requestId) {
         reqOptions.withRequestId = true;
      }
      else if (clientOptions?.withRequestId) {
         reqOptions.withRequestId = clientOptions.withRequestId;
      }

      if (correlationId) {
         reqOptions.correlationId = correlationId;
      }
      else if (chainReq?.correlationId) {
         reqOptions.correlationId = chainReq.correlationId;
      }
      else if (chainReq?.requestId) {
         reqOptions.correlationId = chainReq.requestId;
      }
      else if (clientOptions?.withCorrelationId) {
         reqOptions.withCorrelationId = clientOptions.withCorrelationId;
      }

      if (chainReq?.timestamp) {
         reqOptions.withTimestamp = true;
      }
      else if (clientOptions?.withTimestamp) {
         reqOptions.withTimestamp = clientOptions.withTimestamp;
      }

      return new RpcRequest(method, payload, reqOptions, idGenerator);
   }

   protected createRpcRequestForChain<Payload>(chainReq: IRpcRequest, method: string, payload: Payload, requestId?: string | number, correlationId?: string | number): RpcRequest<Payload> {
      return BaseClient.#createRpcRequestForChain(chainReq, method, payload, this.#options, this.#idGenerator, requestId, correlationId);
   }

   protected serialize(reqOrRes: unknown): string {
      return this.#serializer.serialize(reqOrRes);
   }

   protected deserialize<T>(reqOrRes: string): T {
      return this.#serializer.deserialize<T>(reqOrRes);
   }

   public abstract close(): Promise<void>;

   public extend<R extends Record<string, RPSignature>>(routing: R): this & {[methodName in keyof R]: (payload: typeof routing[methodName][0], requestId?: string | number, correlationId?: string | number) => Promise<IRpcResult<typeof routing[methodName][1]>>} {
      for (const [methodName, fn] of Object.entries(routing)) {
         (this as any)[methodName] = ((payload: any, requestId?: string | number, correlationId?: string | number) => {
            return this.rpcCall(methodName, payload, requestId, correlationId);
         });
      }

      return this as any;
   }
}
