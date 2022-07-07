import { Wallet, WalletsCommand, WalletsEvents, WalletsWindow } from '../interfaces';

declare const window: WalletsWindow;

function push(...command: WalletsCommand) {
    const wallets: Wallet[] = [];
    const listeners: { [E in keyof WalletsEvents]?: WalletsEvents[E][] } = {};

    const method = command[0];
    switch (method) {
        case 'get':
            {
                const [_method, callback] = command;
                callback(wallets);
            }
            break;
        case 'register':
            {
                const [_method, wallets_] = command;
                wallets.push(...wallets_);
                listeners['register']?.forEach((listener) => listener(...wallets_));
            }
            break;
        case 'on':
            {
                const [_method, event, listener, callback] = command;
                listeners[event]?.push(listener) || (listeners[event] = [listener]);
                callback(function (): void {
                    listeners[event] = listeners[event]?.filter((l) => listener !== l);
                });
            }
            break;
    }
}

export function setup() {
    const commands = (window.wallets = window.wallets || []);

    if (Array.isArray(commands)) {
        window.wallets = { push };

        while (commands.length) {
            const command = commands.shift();
            command && push(...command);
        }
    }
}
