const assert = require('node:assert');
const { Factory } = require('@nyth/core');
const { EScenarioStatus } = require('@nyth/common');
const { HttpAdapter } = require('@nyth/http-adapter');
const { HttpClient } = require('@nyth/http-client');
const { WebSocketAdapter } = require('@nyth/ws-adapter');

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

   const req = {
      method: "getLength",
      payload: "blabla"
   };

   const res1 = await fetch(
      'http://localhost:3333/api',
      {
         method: 'POST',
         body: JSON.stringify(req),
      },
      ).then((stream) => stream.json());

   console.log(res1);
   assert.strictEqual(res1.status, EScenarioStatus.SCENARIO_SUCCESS);
   assert.strictEqual(res1.payload, lengthHandler.run(req));

   const client = new HttpClient('http://localhost:3333');

   const res2 = await client.rpcCall("getLength", "foobarbiz");

   console.log(res2);
   assert.strictEqual(res2.status, EScenarioStatus.SCENARIO_SUCCESS);
   assert.strictEqual(res2.payload, "foobarbiz".length);

   await app.stop();
})();
