import { IApplication, IApplicationFactory, IRpcExecutor, PermissionsDeniedError, PermissionsDeniedResult, ScenarioError, ScenarioFailResult, ScenarioSuccessResult, SystemError, SystemErrorResult, THandlerValidationResult } from '@nyth/common';
import { parseFvValidatorErrors } from './fv-error-extractor';
import { validateRequest } from './request.validator';

export const Factory: IApplicationFactory = (routing, adapter) =>
{
   if (routing === null || typeof routing !== 'object') {
      throw new Error('a routing argument should be a dictionary of handlers');
   }

   Object.values(routing).forEach((handler) => {
      if (typeof handler.validate !== 'function' || typeof handler.run !== 'function') {
         throw new Error('a routing argument should be a dictionary of handlers');
      }
   });

   if (typeof adapter?.start !== 'function' || typeof adapter.close !== 'function') {
      throw new Error('an adapter argument should implements IRpcAdapter');
   }

   const executor: IRpcExecutor = async (rpcCall) =>
   {
      const validationResult = validateRequest(rpcCall);
      if (validationResult !== true) {
         const validationErrorMessage = parseFvValidatorErrors(validationResult);
         return new ScenarioFailResult(rpcCall, validationErrorMessage);
      }

      const handler = routing[rpcCall.method];
      if (handler === undefined) {
         return new ScenarioFailResult(rpcCall, 'There is no handler for this RPC method');
      }

      let handlerValidationResult: THandlerValidationResult | null = null;
      try {
         handlerValidationResult = await handler.validate(rpcCall.payload);
         if (handlerValidationResult?.isValidCallData !== true) {
            return new ScenarioFailResult(rpcCall, handlerValidationResult?.validationErrorMessage || 'Unknown RPC handler validation error');
         }
      } catch (err) {
         return new SystemErrorResult(rpcCall, `Error on handler validation: ${(err as Error)?.message}`);
      }

      let result: unknown = null;
      try {
         result = await handler.run(rpcCall);
      } catch (err) {
         if (err instanceof ScenarioError) {
            return ScenarioFailResult.fromError(rpcCall, err);
         }
         else if (err instanceof PermissionsDeniedError) {
            return PermissionsDeniedResult.fromError(rpcCall, err);
         }
         else if (err instanceof SystemError) {
            return SystemErrorResult.fromError(rpcCall, err);
         }
         else {
            return SystemErrorResult.fromError(rpcCall, new SystemError(err));
         }
      }

      const data = new ScenarioSuccessResult(rpcCall, result);

      return data;
   };

   const app: IApplication = {
      async start() {
         await adapter.start(executor);
      },
      async stop() {
         await adapter.close();
      },
   };

   return app;
};
