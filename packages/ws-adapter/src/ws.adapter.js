"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketAdapter = void 0;
const ws_1 = require("ws");
const WebSocketAdapter = class WebSocketAdapter {
    constructor(options) {
        this._server = null;
        this._httpAdapter = null;
        this._options = options;
    }
    async start(executor) {
        if ('httpAdapter' in this._options) {
            this._httpAdapter = this._options.httpAdapter;
            await this._httpAdapter.start(executor);
            this._server = this._httpAdapter.adjust(ws_1.WebSocketServer);
            console.info(`WebSocket server running at http://127.0.0.1:${this._httpAdapter.port}`);
        }
        else {
            this._server = new ws_1.WebSocketServer({ port: this._options.port });
            console.info(`WebSocket server running at http://127.0.0.1:${this._options.port}`);
        }
        this._server.on('connection', (ws) => {
            ws.on('message', async (rawData) => {
                let rpcReq;
                try {
                    rpcReq = JSON.parse(rawData.toString());
                }
                catch {
                    ws.send('Error...');
                    return;
                }
                const result = await executor(rpcReq);
                ws.send(JSON.stringify(result));
            });
        });
    }
    async close() {
        await Promise.all([
            this._closeWs(),
            this._closeHttp(),
        ]);
    }
    _closeWs() {
        return new Promise((resolve, reject) => {
            if (this._server === null) {
                return resolve();
            }
            this._server.close((err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
    _closeHttp() {
        return this._httpAdapter === null
            ? Promise.resolve()
            : this._httpAdapter.close();
    }
};
exports.WebSocketAdapter = WebSocketAdapter;
