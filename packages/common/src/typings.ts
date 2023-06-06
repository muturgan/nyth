import { BaseAdapter } from '@nyth/base-adapter';
import { RpcResult, IRpcRequest, THandlerValidationResult } from '@nyth/models';
import { ISerializer } from '@nyth/serializer';



export type IRpcExecutor = (rpcCall: IRpcRequest) => Promise<RpcResult>;

export interface IRpcAdapter extends BaseAdapter {
   start(executor: IRpcExecutor): void | Promise<void>;
   close(): void | Promise<void>;
}

export type IRpcAdapterConstructor<O = unknown> = new (options: O, serializer?: ISerializer) => IRpcAdapter;

export interface IRpcMethodHandler<Result = unknown, CallData = unknown> {
   validate(rpcCallPayload: CallData): THandlerValidationResult | Promise<THandlerValidationResult>;
   run(rpcCall: IRpcRequest<CallData>): Result | Promise<Result> | never;
}

export type IExecutor<Result = unknown, CallData = unknown> = (handler: IRpcMethodHandler<Result, CallData>) => Promise<Result>;

export interface IApplication {
   start(): Promise<void>;
   stop(): Promise<void>;
}

export type IRouting = Record<string, IRpcMethodHandler>;

export type IApplicationFactory = (handlers: IRouting, adapter: IRpcAdapter) => IApplication | never;
