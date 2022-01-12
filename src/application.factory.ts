import { IApplication, IApplicationFactory, IRpcListener, IUnverifiedRpcRequest, IRpcResult } from './typings';

export const Factory: IApplicationFactory = (routing, adapter) =>
{
   const lestener: IRpcListener = async (rpcCall: IUnverifiedRpcRequest) => {
      const method = rpcCall?.method;
      if (typeof method !== 'string') {
         throw new Error();
      }

      const handler = routing[method];
      if (handler === undefined) {
         throw new Error();
      }

      const isValid = handler.validate(rpcCall);
      if (isValid !== true) {
         throw new Error();
      }

      const result = await handler.run(rpcCall as any);

      const data: IRpcResult = {
         payload: result,
      };

      return data;
   };

   const app: IApplication = {
      async start() {
         await adapter.start(lestener);
      },
      async stop() {
         await adapter.close();
      },
   };

   return app;
};