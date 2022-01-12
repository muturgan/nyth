export type IUnverifiedRpcRequest = Record<string, unknown>;

export interface IRpcRequestWithMethod extends IUnverifiedRpcRequest {
   readonly method: string;
}

export interface IRpcRequest<T = undefined> extends IRpcRequestWithMethod {
   readonly payload: T;
}

export interface IRpcResult<Payload = unknown> {
   readonly payload: Payload;
}

export type IRpcListener = (rpcCall: IRpcRequest) => Promise<IRpcResult>;

export interface IRpcAdapter {
   start(handler: IRpcListener): void | Promise<void>;
   close(): void | Promise<void>;
}

export type IRpcAdapterConstructor<O = unknown> = new (options: O) => IRpcAdapter;

export interface IRpcMethodHandler<Result = unknown, CallData = undefined> {
   validate(rpcCall: IUnverifiedRpcRequest): rpcCall is IRpcRequest<CallData>;
   run(rpcCall: IRpcRequest<CallData>): Result | Promise<Result>;
}

export type IExecutor<Result = unknown, CallData = undefined> = (handler: IRpcMethodHandler<Result, CallData>) => Promise<Result>;

export interface IApplication {
   start(): Promise<void>;
   stop(): Promise<void>;
}

export type IRouting = Record<string, IRpcMethodHandler>;

export type IApplicationFactory = (handlers: IRouting, adapter: IRpcAdapter) => IApplication;