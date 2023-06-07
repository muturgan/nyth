const randomUUID: () => string = typeof window !== 'undefined' && typeof window.document !== 'undefined'
   ? globalThis.crypto.randomUUID
   : require('node:crypto').randomUUID;

export interface IRpcRequest<Payload = unknown> {
   readonly method: string;
   readonly payload: Payload;
   readonly correlationId?: string | number | null;
   readonly requestId?: string | number | null;
   readonly version?: number | null;
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
   ) {
      if (options?.correlationId) {
         this.correlationId = options.correlationId;
      }
      else if (options?.withCorrelationId) {
         this.correlationId = randomUUID();
      }

      if (options?.requestId) {
         this.requestId = options.requestId;
      }
      else if (options?.withRequestId) {
         this.requestId = randomUUID();
      }

      if (options?.withTimestamp) {
         this.timestamp = Date.now();
      }
   }
}

export class RpcRequestWithTimestamp<Payload = unknown> extends RpcRequest<Payload> {
   constructor(method: string, payload: Payload) {
      super(method, payload, {withTimestamp: true});
   }
}

export class RpcRequestWithRequestId<Payload = unknown> extends RpcRequest<Payload> {
   constructor(method: string, payload: Payload) {
      super(method, payload, {withRequestId: true});
   }
}

export class RpcRequestWithCorrelationId<Payload = unknown> extends RpcRequest<Payload> {
   constructor(method: string, payload: Payload) {
      super(method, payload, {withCorrelationId: true, withRequestId: true});
   }
}

export class FullRpcRequest<Payload = unknown> extends RpcRequest<Payload> {
   constructor(method: string, payload: Payload) {
      super(method, payload, {withCorrelationId: true, withRequestId: true, withTimestamp: true});
   }
}
