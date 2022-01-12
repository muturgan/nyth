import http = require('http');
import qs = require('querystring');



const GET = 'GET';
const POST = 'POST';
const QUERY_SEPARATOR = '?';
const API = '/api';


const server = http.createServer(async (req, res): Promise<void> =>
{
   if (typeof req.url !== 'string') {
      res.socket?.destroy();
      return;
   }

   const [pathName, searchStr] = req.url.split(QUERY_SEPARATOR);

   if (pathName !== API) {
      res.socket?.destroy();
      return;
   }


   let rpcReq: Record<string, unknown>;

   switch (req.method)
   {
      case GET:
         rpcReq = {...qs.parse(searchStr)};
         break;


      case POST:
         const chunks: Buffer[] = [];
         try {
            for await (const chunk of req) {
               chunks.push(chunk);
            }
         } catch (err) {
            console.info('Connection error!');
            console.info(err);
            res.writeHead(500);
            res.end('Connection error');
            return;
         }

         const body = Buffer.concat(chunks).toString();
         try {
            rpcReq = JSON.parse(body);
         } catch {
            res.writeHead(400);
            res.end('Incorrect request body. It should be a valid json-serialized object');
            return;
         }
         break;

      default:
         res.socket?.destroy();
         return;
   }

   console.log('rpcReq:');
   console.log(rpcReq);

   res.end('Hello World!');
   return;

});

server.listen(3333, () => console.info(`Server running at http://127.0.0.1:${3333}/`));