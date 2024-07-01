import assert from 'node:assert';
import { Factory } from '@nyth/core';
import { EScenarioStatus } from '@nyth/models';
import { HttpAdapter } from '@nyth/http-adapter';
import { HttpClient } from '@nyth/http-client';
import { WebSocketAdapter } from '@nyth/ws-adapter';

const lengthHandler = {
   validate(rpcCallPayload) {
      const isValidCallData = typeof rpcCallPayload === 'string';
      return {
         isValidCallData,
         validationErrorMessage: isValidCallData ? null : 'request payload should be a string',
      };
   },
   run(rpcCall) {
      return rpcCall.payload.length;
   },
};

const httpAdapter = new HttpAdapter({port: 3333});
const wsAdapter = new WebSocketAdapter({httpAdapter: httpAdapter});

const routing = {
   getLength: lengthHandler,
};

const app = Factory(routing, wsAdapter);

(async () => {
   await app.start();

   const client = new HttpClient('http://localhost:3333');

   const payload = "foobarbiz";

   const res = await client.rpcCall("getLength", payload);

   console.log('res:');
   console.log(res);
   assert.strictEqual(res.status, EScenarioStatus.SCENARIO_SUCCESS);
   assert.strictEqual(res.payload, payload.length);

   await app.stop();
})();
