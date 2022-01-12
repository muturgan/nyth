import http = require('http');



const GET = 'GET';
const POST = 'POST';
const DUMMY_FAVICON = '/favicon.ico';


const server = http.createServer(async (req, res): Promise<void> => {

   if (req.url === undefined) {
      res.socket?.destroy();
      return;
   }

   switch (req.method) {

      case GET:

         if (req.url === DUMMY_FAVICON) {
            res.writeHead(204);
            res.end();
            return;
         }

         if (req.url === '/hello') {
            res.end('Hello World!');
            return;
         }

         res.socket?.destroy();
         return;


      case POST:
         res.socket?.destroy();
         return;


      default:
         res.socket?.destroy();
         return;
   }

});

server.listen(3333, () => console.info(`Server running at http://127.0.0.1:${3333}/`));