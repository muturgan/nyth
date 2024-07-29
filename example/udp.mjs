import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { setTimeout as asyncTimeout } from 'node:timers/promises';
import { Factory } from '@nyth/core';
import { EScenarioStatus } from '@nyth/models';
import { UdpAdapter } from '@nyth/udp-adapter';
import { UdpClient } from '@nyth/udp-client';

const lengthHandler = {
   validate(rpcCallPayload) {
      const isValidCallData = typeof rpcCallPayload === 'string';
      return {
         isValidCallData,
         validationErrorMessage: isValidCallData ? null : 'request payload should be a string',
      };
   },
   async run(rpcCall) {
      const t = +(Math.random() * 5000).toFixed();
      console.log({t});
      await asyncTimeout(t);
      return rpcCall.payload.length;
   },
};

const adapter = new UdpAdapter({port: 3333});

const routing = {
   getLength: lengthHandler,
};

const app = Factory(routing, adapter);

(async () => {
   await app.start();

   const client = new UdpClient(3333, '127.0.0.1');

   const payload = "blabla";

   const [res] = await Promise.all([
      client.rpcCall("getLength", payload, randomUUID()).then((r) => {console.log('1 is here'); return r;}),
      client.rpcCall("getLength", payload, randomUUID()).then((r) => {console.log('2 is here'); return r;}),
      client.rpcCall("getLength", payload, randomUUID()).then((r) => {console.log('3 is here'); return r;}),
   ]);

   console.log('result:');
   console.log(res);
   assert.strictEqual(res.status, EScenarioStatus.SCENARIO_SUCCESS);
   assert.strictEqual(res.payload, payload.length);

   await client.close();
   await app.stop();
})();
