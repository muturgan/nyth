import { BaseAdapter } from './base-adapter';
import { ISerializer } from './serializer';

export interface IRpcRequest<T = undefined> {
   readonly method: string;
   readonly payload: T;
   readonly requestId?: string | number | null;
   readonly version?: number | null;
   readonly timestamp?: number | null;
}

export interface IRpcResult<Payload = unknown> {
   readonly payload: Payload;
}

export type IRpcExecutor = (rpcCall: IRpcRequest) => Promise<IRpcResult>;

export interface IRpcAdapter extends BaseAdapter {
   start(executor: IRpcExecutor): void | Promise<void>;
   close(): void | Promise<void>;
}

export type IRpcAdapterConstructor<O = unknown> = new (options: O, serializer?: ISerializer) => IRpcAdapter;

export interface IRpcMethodHandler<Result = unknown, CallData = undefined> {
   validate(rpcCallPayload: unknown): rpcCallPayload is CallData;
   run(rpcCall: IRpcRequest<CallData>): Result | Promise<Result>;
}

export type IExecutor<Result = unknown, CallData = undefined> = (handler: IRpcMethodHandler<Result, CallData>) => Promise<Result>;

export interface IApplication {
   start(): Promise<void>;
   stop(): Promise<void>;
}

export type IRouting = Record<string, IRpcMethodHandler>;

export type IApplicationFactory = (handlers: IRouting, adapter: IRpcAdapter) => IApplication;
