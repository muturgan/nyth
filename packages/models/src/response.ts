import { IRpcRequest } from './request';

import { INTERNAL_ERROR_MESSAGE, PERMISSIONS_DENIED_MESSAGE, ScenarioError, SystemError, PermissionsDeniedError } from './error';

export enum EScenarioStatus {
   SCENARIO_SUCCESS = 1,
   PERMISSIONS_DENIED,
   SCENARIO_FAIL,
   SYSTEM_ERROR,
}

export interface IRpcResult<Payload> {
   readonly status: EScenarioStatus;
   readonly payload?: Payload | null;
   readonly correlationId?: string | number | null;
   readonly requestId?: string | number | null;
   readonly timestamp?: number | null;
}

export abstract class RpcResult<Payload = unknown> implements IRpcResult<Payload>
{
   public readonly correlationId?: string | number;
   public readonly requestId?: string | number;
   public readonly timestamp = Date.now();

   protected constructor(
      public readonly status: EScenarioStatus,
      public readonly payload: Payload | null = null,
      request?: IRpcRequest,
   ) {
      if (request?.correlationId) {
         this.correlationId = request.correlationId;
      }
      if (request?.requestId) {
         this.requestId = request.requestId;
      }
   }
}

export class ScenarioSuccessResult<Payload> extends RpcResult<Payload> {
   declare public readonly status: EScenarioStatus.SCENARIO_SUCCESS;

   constructor(request: IRpcRequest, payload?: Payload) {
      super(EScenarioStatus.SCENARIO_SUCCESS, payload, request);
   }
}

export class PermissionsDeniedResult extends RpcResult<string>
{
   public static fromError(request: IRpcRequest, err: PermissionsDeniedError): PermissionsDeniedResult {
      return new PermissionsDeniedResult(request, err.message);
   }

   declare public readonly status: EScenarioStatus.PERMISSIONS_DENIED;

   constructor(request: IRpcRequest, message?: string | null) {
      super(EScenarioStatus.PERMISSIONS_DENIED, message || PERMISSIONS_DENIED_MESSAGE, request);
   }
}

export class ScenarioFailResult extends RpcResult<string>
{
   public static fromError(request: IRpcRequest, err: ScenarioError): ScenarioFailResult {
      return new ScenarioFailResult(request, err.message);
   }

   declare public readonly status: EScenarioStatus.SCENARIO_FAIL;

   constructor(request: IRpcRequest, message: string) {
      super(EScenarioStatus.SCENARIO_FAIL, message, request);
   }
}

export class SystemErrorResult extends RpcResult<string>
{
   public static fromError(request: IRpcRequest, err: SystemError): SystemErrorResult {
      return new SystemErrorResult(request, err.message);
   }

   declare public readonly status: EScenarioStatus.SYSTEM_ERROR;

   constructor(request: IRpcRequest, message: string) {
      super(EScenarioStatus.SYSTEM_ERROR, message || INTERNAL_ERROR_MESSAGE, request);
   }
}
