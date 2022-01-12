import { IRpcRequest, IRpcMethodHandler } from './typings';

export const lengthHandler: IRpcMethodHandler<number, string> = {
   validate(rpcCall): rpcCall is IRpcRequest<string> {
      return typeof rpcCall?.payload === 'string';
   },
   run(rpcCall) {
      const isValid = this.validate(rpcCall);
      if (isValid) {
         return rpcCall.payload.length;
      }
      else {
         return 0;
      }
   },
};
