import { IRpcRequest, IRpcResult } from './typings';

export interface ISerializer {
   deserialize(req: string): IRpcRequest;
   serialize(res: IRpcResult): string;
}

export const defaultSerializer: ISerializer = {
   deserialize(req) {
      return JSON.parse(req);
   },
   serialize(res) {
      return JSON.stringify(res);
   },
};
