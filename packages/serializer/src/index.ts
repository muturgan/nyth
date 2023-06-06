export interface ISerializer {
   deserialize<T>(req: string): T;
   serialize(res: unknown): string;
}

export const defaultSerializer: ISerializer = {
   deserialize(req) {
      return JSON.parse(req);
   },
   serialize(res) {
      return JSON.stringify(res);
   },
};
