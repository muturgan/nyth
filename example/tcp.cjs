const assert = require('node:assert');
const { Factory } = require('@nyth/core');
const { EScenarioStatus } = require('@nyth/models');
const { TcpAdapter } = require('@nyth/tcp-adapter');
const { TcpClient } = require('@nyth/tcp-client');

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

const tcpAdapter = new TcpAdapter({port: 3333});

const routing = {
   getLength: lengthHandler,
};

const app = Factory(routing, tcpAdapter);

(async () => {
   await app.start();

   const client = new TcpClient(3333, '127.0.0.1');

   const payload = "blabla";

   const res = await client.rpcCall("getLength", payload);

   console.log('result:');
   console.log(res);
   assert.strictEqual(res.status, EScenarioStatus.SCENARIO_SUCCESS);
   assert.strictEqual(res.payload, payload.length);

   await app.stop();
})();
