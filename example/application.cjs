const { Factory } = require('@nyth/core');
const { HttpAdapter } = require('@nyth/http-adapter');
const { WebSocketAdapter } = require('@nyth/ws-adapter');

const lengthHandler = {
   validate(rpcCallPayload) {
      return typeof rpcCallPayload === 'string';
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

   const res = await fetch(
      'http://localhost:3333/api',
      {
         method: 'POST',
         body: JSON.stringify(req),
      },
      ).then((stream) => stream.json());

   console.log({
      length: res.payload,
   });

   await app.stop();
})();
