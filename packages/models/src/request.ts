import { TIdGenerator, defaultIdGenerator } from './id-generator';

export interface IRpcRequest<Payload = unknown> {
   readonly method: string;
   readonly payload: Payload;
   readonly correlationId?: string | number | null;
   readonly requestId?: string | number | null;
   readonly timestamp?: number | null;
}

export interface IRpcRequestOptions {
   withCorrelationId?: boolean;
   withRequestId?: boolean;
   withTimestamp?: boolean;
   correlationId?: string | number | null;
   requestId?: string | number | null;
}

export class RpcRequest<Payload = unknown> implements IRpcRequest<Payload> {
   public readonly correlationId?: string | number | null | undefined;
   public readonly requestId?: string | number | null | undefined;
   public readonly timestamp?: number | null | undefined;

   constructor(
      public readonly method: string,
      public readonly payload: Payload,
      options?: Readonly<IRpcRequestOptions>,
      idGenerator?: TIdGenerator | null,
   ) {
      const now = Date.now();
      const generator = idGenerator || defaultIdGenerator;

      if (options?.correlationId) {
         this.correlationId = options.correlationId;
      }
      else if (options?.withCorrelationId) {
         this.correlationId = generator(now);
      }

      if (options?.requestId) {
         this.requestId = options.requestId;
      }
      else if (options?.withRequestId) {
         this.requestId = generator(now);
      }

      if (options?.withTimestamp) {
         this.timestamp = now;
      }
   }
}

export class RpcRequestWithTimestamp<Payload = unknown> extends RpcRequest<Payload> {
   constructor(method: string, payload: Payload, idGenerator?: TIdGenerator | null) {
      super(method, payload, {withTimestamp: true}, idGenerator);
   }
}

export class RpcRequestWithRequestId<Payload = unknown> extends RpcRequest<Payload> {
   constructor(method: string, payload: Payload, idGenerator?: TIdGenerator | null) {
      super(method, payload, {withRequestId: true}, idGenerator);
   }
}

export class RpcRequestWithCorrelationId<Payload = unknown> extends RpcRequest<Payload> {
   constructor(method: string, payload: Payload, idGenerator?: TIdGenerator | null) {
      super(method, payload, {withCorrelationId: true, withRequestId: true}, idGenerator);
   }
}

export class FullRpcRequest<Payload = unknown> extends RpcRequest<Payload> {
   constructor(method: string, payload: Payload, idGenerator?: TIdGenerator | null) {
      super(method, payload, {withCorrelationId: true, withRequestId: true, withTimestamp: true}, idGenerator);
   }
}
