export interface ISerializer {
   deserialize<T>(reqOrRes: string): T;
   serialize(reqOrRes: unknown): string;
}

interface IRequestFeature {
   readonly method: string;
   readonly status?: undefined | null;
}

interface IResultFeature {
   readonly method?: undefined | null;
   readonly status: number;
}

type TDiff = IRequestFeature | IResultFeature;

interface ICommon {
   readonly payload?: unknown | null;
   readonly correlationId?: string | number | null;
   readonly requestId?: string | number | null;
   readonly timestamp?: number | null;
}

type TFull = ICommon & TDiff;

const METHOD = 1;
const STATUS = 2;

type TKey = typeof METHOD | typeof STATUS;

type TFlat = [
   key: TKey,
   methodOrStatus: string | number,
   payload: unknown | null | undefined,
   timestamp?: number | null | undefined,
   requestId?: string | number | null | undefined,
   correlationId?: string | number | null | undefined,
];

export const defaultSerializer: ISerializer = {
   deserialize<T>(reqOrRes: string): T {
      const [key, methodOrStatus, payload, timestamp, requestId, correlationId] = JSON.parse(reqOrRes) as TFlat;

      const result: TFull = {
         method: key === METHOD ? methodOrStatus as string : null,
         status: key === STATUS ? methodOrStatus as number : null,
         payload,
         timestamp,
         requestId,
         correlationId,
      } as any;

      return result as any;
   },

   serialize(reqOrRes: TFull): string {
      if (!reqOrRes) {
         throw new Error('incorrect value for serialization');
      }

      let key: TKey;
      let methodOrStatus: string | number;
      if (reqOrRes.method) {
         key = METHOD;
         methodOrStatus = reqOrRes.method;
      }
      else if (reqOrRes.status) {
         key = STATUS;
         methodOrStatus = reqOrRes.status;
      }
      else {
         throw new Error('incorrect value for serialization');
      }

      const flat: TFlat = [key, methodOrStatus, reqOrRes.payload, reqOrRes.timestamp, reqOrRes.requestId, reqOrRes.correlationId];

      while (flat[flat.length - 1] === null || flat[flat.length - 1] === undefined) {
         flat.pop();
      }

      return JSON.stringify(flat);
   },
};

export const simpleJsonSerializer: ISerializer = {
   deserialize(reqOrRes) {
      return JSON.parse(reqOrRes);
   },
   serialize(reqOrRes) {
      return JSON.stringify(reqOrRes);
   },
};
