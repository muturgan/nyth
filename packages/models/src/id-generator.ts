export type TIdGenerator = (currentTimestamp?: number) => string | number;

const C_EPOCH = -12219292800n; // RFC-4122 epoch: '1582-10-15 00:00:00'
// const C_VARIANT = 8000000000000000n; // -- RFC-4122 variant: b'10xx...'
const V6 = '6';
const V7 = '7';
const DASH = '-';

// const getRandomInt = (min: number, max: number): number => {
//    return Math.floor(Math.random() * (max - min + 1)) + min;
// };

// const randomBytes = (length: number): string => {
//    const max = 2 ** (length * 8) - 1;
//    const randomInt = getRandomInt(0, max);
//    return randomInt.toString(16).padStart(length * 2, '0');
// };

// randomBytes(2)
const getTwoBytes = (): string => {
   const randomInt = Math.floor(Math.random() * 65536);
   return randomInt.toString(16).padStart(4, '0');
};

// randomBytes(6)
const getSixBytes = (): string => {
   const randomInt = Math.floor(Math.random() * 281474976710656);
   return randomInt.toString(16).padStart(12, '0');
};

const getFakeMicroseconds = (): string => {
   // if (typeof performance === 'undefined') {
   //    return 0n;
   // }
   // const now = performance.now(); // 17945.433421999216
   // const [, tail] = now.toFixed(3).split('.');

   const rnd = Math.floor(Math.random() * 1000); // getRandomInt 0 - 999
   return rnd.toString().padStart(3, '0');
};

const concatUuid = (v_timestamp: bigint, version: string): string => {
   const v_timestamp_hex = v_timestamp.toString(16).padStart(16, '0');
   // Generate the random hexadecimal (and set variant b'10xx')
   // const v_random = BigInt(Math.random() * 4611686018427388000 /* 2^62 */) | C_VARIANT;
   // const v_random_hex = v_random.toString(16).padStart(16, '0')

   const uuid = v_timestamp_hex.slice(1, 9) + DASH
      + v_timestamp_hex.slice(9, 13) + DASH
      + version + v_timestamp_hex.slice(13, 16) + DASH
      + getTwoBytes() + DASH // v_random_hex.slice(0, 4) + DASH
      + getSixBytes(); // v_random_hex.slice(4, 16);
   return uuid;
};

// thank you Fabiolimace!
// https://gist.github.com/fabiolimace/515a0440e3e40efeb234e12644a6a346
export const generateUuidV6: TIdGenerator = (nowMillis?: number): string => {
   const nowStr = (nowMillis || Date.now()).toString();
   const v_secs = BigInt(nowStr.slice(0, 10));
   const v_msec = nowStr.slice(10, 13);
   const v_usec = BigInt(v_msec + getFakeMicroseconds());
   const v_timestamp = (((v_secs - C_EPOCH) * 1000000n) + v_usec) * 10n;

   return concatUuid(v_timestamp, V6);
};

export const generateUuidV7: TIdGenerator = (nowMillis?: number): string => {
   const nowStr = (nowMillis || Date.now()).toString();
   const v_secs = BigInt(nowStr.slice(0, 10));
   const v_msec = BigInt(nowStr.slice(10, 13));
   const v_usec = BigInt(getFakeMicroseconds());
   const v_timestamp = (((v_secs * 1000n) + v_msec) << 12n) | (v_usec << 2n);

   return concatUuid(v_timestamp, V7);
};

export const defaultIdGenerator = generateUuidV6;
