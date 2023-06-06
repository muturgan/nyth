import { IApplication, IApplicationFactory, IRpcExecutor, ScenarioFailResult, ScenarioSuccessResult, SystemError, SystemErrorResult } from '@nyth/common';
import { parseFvValidatorErrors } from './fv-error-extractor';
import { validateRequest } from './request.validator';
import { ValidationError } from 'fastest-validator';

const predicateRpcCall = (rpcCall: unknown, validationResult: boolean | ValidationError[]): validationResult is boolean => {
   return Boolean(rpcCall) && validationResult === true;
};

export const Factory: IApplicationFactory = (routing, adapter) =>
{
   const executor: IRpcExecutor = async (rpcCall) => {
      try {
         const validationResult = validateRequest(rpcCall);
         if (!predicateRpcCall(rpcCall, validationResult)) {
            const validationErrorMessage = parseFvValidatorErrors(validationResult);
            return new ScenarioFailResult(rpcCall, validationErrorMessage);
         }

         const handler = routing[rpcCall.method];
         if (handler === undefined) {
            return new ScenarioFailResult(rpcCall, 'There is no handler for this RPC method');
         }

         const handlerValidationResult = handler.validate(rpcCall.payload);
         if (handlerValidationResult.isValidCallData !== true) {
            return new ScenarioFailResult(rpcCall, handlerValidationResult.validationErrorMessage);
         }

         const result = await handler.run(rpcCall);

         const data = new ScenarioSuccessResult(rpcCall, result);

         return data;
      }
      catch (err) {
         return SystemErrorResult.fromError(rpcCall, new SystemError(err));
      }
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
