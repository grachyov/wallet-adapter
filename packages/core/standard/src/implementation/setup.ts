import { Wallet, WalletsCommands, WalletsEvents, WalletsWindow } from '../interfaces';

declare const window: WalletsWindow;

function push(...commands: WalletsCommands) {
    const wallets: Wallet[] = [];
    const listeners: { [E in keyof WalletsEvents]?: WalletsEvents[E][] } = {};

    for (const command of commands) {
        switch (command.method) {
            case 'get':
                {
                    const { callback } = command;
                    callback(wallets);
                }
                break;
            case 'register':
                {
                    const { wallets: wallets_ } = command;
                    wallets.push(...wallets_);
                    listeners['register']?.forEach((listener) => listener(...wallets_));
                }
                break;
            case 'on':
                {
                    const { event, listener, callback } = command;
                    listeners[event]?.push(listener) || (listeners[event] = [listener]);
                    callback(function (): void {
                        listeners[event] = listeners[event]?.filter((l) => listener !== l);
                    });
                }
                break;
        }
    }
}

export function setup() {
    const commands = (window.wallets = window.wallets || []);

    if (Array.isArray(commands)) {
        window.wallets = { push };
        push(...commands);
    }
}
