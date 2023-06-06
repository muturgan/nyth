import { RpcResult } from './responses';
import { IRpcRequest } from './typings';

export interface ISerializer {
   deserialize(req: string): IRpcRequest;
   serialize(res: RpcResult): string;
}

export const defaultSerializer: ISerializer = {
   deserialize(req) {
      return JSON.parse(req);
   },
   serialize(res) {
      return JSON.stringify(res);
   },
};
