import { IApplication, IApplicationFactory, IRpcExecutor, IRpcResult, IRpcRequest } from '@nyth/common';
import { validateRequest } from './request.validator';
import { ValidationError } from 'fastest-validator';

const predicateRpcCall = (rpcCall: unknown, validationResult: boolean | ValidationError[]): rpcCall is IRpcRequest => {
   return Boolean(rpcCall) && validationResult === true;
};

export const Factory: IApplicationFactory = (routing, adapter) =>
{
   const executor: IRpcExecutor = async (rpcCall: unknown) => {
      const validationResult = validateRequest(rpcCall);
      if (!predicateRpcCall(rpcCall, validationResult)) {
         throw new Error();
      }

      const method = rpcCall.method;
      if (typeof method !== 'string') {
         throw new Error();
      }

      const handler = routing[method];
      if (handler === undefined) {
         throw new Error();
      }

      const isValid = handler.validate(rpcCall.payload);
      if (isValid !== true) {
         throw new Error();
      }

      const result = await handler.run(rpcCall);

      const data: IRpcResult = {
         payload: result,
      };

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
