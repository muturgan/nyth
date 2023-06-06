import { BaseAdapter } from '@nyth/base-adapter';
import { ISerializer } from '@nyth/serializer';
import { RpcResult } from './responses';

export interface IRpcRequest<Payload = unknown> {
   readonly method: string;
   readonly payload: Payload;
   readonly correlationId?: string | number | null;
   readonly requestId?: string | number | null;
   readonly version?: number | null;
   readonly timestamp?: number | null;
}

export type IRpcExecutor = (rpcCall: IRpcRequest) => Promise<RpcResult>;

export interface IRpcAdapter extends BaseAdapter {
   start(executor: IRpcExecutor): void | Promise<void>;
   close(): void | Promise<void>;
}

export type IRpcAdapterConstructor<O = unknown> = new (options: O, serializer?: ISerializer) => IRpcAdapter;

export interface IHandlerValidationSuccess {
   readonly isValidCallData: true;
   readonly validationErrorMessage?: null;
}
export interface IHandlerValidationFail {
   readonly isValidCallData: false;
   readonly validationErrorMessage: string;
}
export type THandlerValidationResult = IHandlerValidationSuccess | IHandlerValidationFail;

export interface IRpcMethodHandler<Result = unknown, CallData = unknown> {
   validate(rpcCallPayload: CallData): THandlerValidationResult | Promise<THandlerValidationResult>;
   run(rpcCall: IRpcRequest<CallData>): Result | Promise<Result> | never;
}

export interface IRpcRequestOptions {
   withCorrelationId?: boolean;
   withRequestId?: boolean;
   withTimestamp?: boolean;
   correlationId?: string | number | null;
   requestId?: string | number | null;
}

export type IExecutor<Result = unknown, CallData = unknown> = (handler: IRpcMethodHandler<Result, CallData>) => Promise<Result>;

export interface IApplication {
   start(): Promise<void>;
   stop(): Promise<void>;
}

export type IRouting = Record<string, IRpcMethodHandler>;

export type IApplicationFactory = (handlers: IRouting, adapter: IRpcAdapter) => IApplication | never;
