const assert = require('node:assert');
const crypto = require('node:crypto');
const net = require('node:net');
const { Factory } = require('@nyth/core');
const { EScenarioStatus } = require('@nyth/common');
const { TcpAdapter } = require('@nyth/tcp-adapter');

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

   const client = new net.Socket();
   const port = 3333;
   const host = '127.0.0.1';

   const req = {
      method: "getLength",
      payload: "blabla",
      correlationId: crypto.randomUUID(),
      requestId: crypto.randomUUID(),
   };

   client.on('data', async (data) => {
      const res = JSON.parse(data);

      console.log('result');
      console.log(res);
      assert.strictEqual(res.status, EScenarioStatus.SCENARIO_SUCCESS);
      assert.strictEqual(res.payload, lengthHandler.run(req));

      await app.stop();
   });

   client.connect(port, host, () => {
      client.write(JSON.stringify(req));
   });
})();
