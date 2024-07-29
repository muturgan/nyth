import { ISerializer } from '@nyth/serializer';
import { IRpcRequest, IRpcResult, TIdGenerator } from '@nyth/models';
import { BaseClient, IBaseClientOptions } from './base';
import { EventEmitter } from './event_emitter';

export abstract class AsyncClient extends BaseClient {
   public override get ASYNC(): true {
      return true;
   }

   readonly #RESPONSE_EVENT = Symbol();

   protected readonly response$ = new EventEmitter();

   protected readonly promises: Record<string | number, [resolve: (response: IRpcResult<any>) => void, reject: (err: any) => void]> = {};

   constructor(options?: IBaseClientOptions | null, serializer?: ISerializer | null, idGenerator?: TIdGenerator | null) {
      super(options, serializer, idGenerator);

      this.response$.on(this.#RESPONSE_EVENT, (response: string): void => {
         let deserialized: IRpcResult<unknown>;
         try {
            deserialized = this.deserialize<IRpcResult<unknown>>(response);
         } catch (err) {
            console.error('[AsyncClient] deserialization error', err);
            return;
         }

         const requestId = deserialized.requestId;
         if (!requestId) {
            return;
         }

         const box = this.promises[requestId];
         if (!box) {
            return;
         }

         delete this.promises[requestId];
         const [resolve, reject] = box;

         resolve(deserialized);
      });
   }

   protected abstract override transportCall(serialized: string, requestId: string | number): Promise<''>;

   public override async rpcCall<ResPayload, ReqPayload>(method: string, payload: ReqPayload, requestId: string | number, correlationId?: string | number): Promise<IRpcResult<ResPayload>> {
      const req = this.createRpcRequest(method, payload, requestId, correlationId);
      const serialized = this.serialize(req);

      await this.transportCall(serialized, requestId);

      return new Promise<IRpcResult<ResPayload>>((resolve, reject) => {
         this.promises[requestId] = [resolve, reject];
      });
   }

   public override async rpcCallWithChain<ResPayload, ReqPayload>(chainReq: IRpcRequest, method: string, payload: ReqPayload, requestId: string | number, correlationId?: string | number): Promise<IRpcResult<ResPayload>> {
      const req = this.createRpcRequestForChain(chainReq, method, payload, requestId, correlationId);
      const serialized = this.serialize(req);

      await this.transportCall(serialized, requestId);

      return new Promise<IRpcResult<ResPayload>>((resolve, reject) => {
         this.promises[requestId] = [resolve, reject];
      });
   }

   protected emit(response: string): void {
      this.response$.emit(this.#RESPONSE_EVENT, response);
   }
}
