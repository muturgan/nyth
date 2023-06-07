const crypto = globalThis.crypto || require('node:crypto');

export type TIdGenerator = (currentTimestamp?: number) => string | number;

export const defaultIdGenerator: TIdGenerator = (now?: number): string => {
   const uuid = crypto.randomUUID();
   const prefix = (now || Date.now()).toString(36);
   return prefix + uuid.slice(8);
};
