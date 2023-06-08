const dgram = require('node:dgram');

const PORT = 33333;
const HOST = '127.0.0.1';

// Server
const server = dgram.createSocket('udp4', (message, remote) => {
    console.log('[server] (MSG) ' + remote.address + ':' + remote.port +' - ' + message);

    const response = 'Fuck you!';
    server.send(response, 0, response.length, remote.port, remote.address, (err, bytes) => {
        if (err) {
            throw err;
        }
        console.log('[server] UDP message sent to ' + remote.address +':'+ remote.port);
    });
});

server.bind(PORT, HOST);

// Client
const message = Buffer.from('My KungFu is Good!');

const client = dgram.createSocket('udp4');
client.send(message, 0, message.length, PORT, HOST, (err, bytes) => {
    if (err) {
        throw err;
    }
    console.log('[client] UDP message sent to ' + HOST +':'+ PORT);
});

client.send('message', 0, 'message'.length, PORT, HOST, (err, bytes) => {
    if (err) {
        throw err;
    }
    console.log('[client] UDP message sent to ' + HOST +':'+ PORT);
});

client.on('message', (message, remote) => {
    console.log('[CALLBACK] (MSG) ' + remote.address + ':' + remote.port);
    console.log(message.toString());
});
