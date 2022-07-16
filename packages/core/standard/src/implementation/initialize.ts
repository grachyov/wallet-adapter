import { Wallet, WalletsCommand, WalletsEvents, WalletsWindow } from '../interfaces';

declare const window: WalletsWindow;

export function initialize() {
    const commands = (window.wallets = window.wallets || []);

    if (Array.isArray(commands)) {
        const wallets: Wallet[] = [];
        const listeners: { [E in keyof WalletsEvents]?: WalletsEvents[E][] } = {};

        function push(...commands: WalletsCommand[]) {
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

        window.wallets = { push };
        push(...commands);
    }
}
