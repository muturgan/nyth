import { IRpcMethodHandler } from './typings';

export const lengthHandler: IRpcMethodHandler<number, string> = {
   validate(rpcCallPayload): rpcCallPayload is string {
      return typeof rpcCallPayload === 'string';
   },
   run(rpcCall) {
      return rpcCall.payload.length;
   },
};
