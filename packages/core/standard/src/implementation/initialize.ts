import { Wallet, WalletsCommand, WalletsEvents, WalletsWindow } from '../interfaces';

declare const window: WalletsWindow;

export function push(...commands: WalletsCommand[]) {
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
                    const { wallets: newWallets } = command;
                    wallets.push(...newWallets);
                    listeners['register']?.forEach((listener) => listener(...newWallets));
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

export function initialize() {
    const wallets = (window.wallets = window.wallets || []);
    if (Array.isArray(wallets)) {
        window.wallets = { push };
        push(...wallets);
    }
}
