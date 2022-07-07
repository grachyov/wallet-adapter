import { Wallet } from './wallet';

/**
 * Browser window containing a global `wallets` object.
 */
export interface WalletsWindow extends Window {
    /**
     * Global `wallets` object.
     */
    wallets?: WalletsCommands | Wallets;
}

/**
 * Events emitted by the global `wallets` object.
 */
export interface WalletsEvents {
    /**
     * Emitted when one or more wallets are registered.
     *
     * @param wallets One or more wallets that were registered.
     */
    register(...wallets: Wallet[]): void;
}

/**
 * TODO: docs
 */
export type WalletsCommand = WalletsCommandGet | WalletsCommandRegister | WalletsCommandOn;

/**
 * Get the wallets that have been registered.
 */
export type WalletsCommandGet = ['get', (wallets: Readonly<Wallet[]>) => void];

/**
 * Register one or more wallets. This emits a `register` event.
 */
export type WalletsCommandRegister = ['register', Readonly<Wallet[]>];

/**
 * Add an event listener to subscribe to events.
 */
export type WalletsCommandOn<E extends keyof WalletsEvents = keyof WalletsEvents> = [
    'on',
    E,
    WalletsEvents[E],
    (unsubscribe: () => void) => void
];

/**
 * TODO: docs
 */
export type WalletsCommands = WalletsCommand[];

/**
 * Global `wallets` object API.
 */
export type Wallets = Readonly<{
    /**
     * Get the wallets that have been registered.
     *
     * @param method  'get'
     * @param callback Function that will be called with all wallets that have been registered.
     */
    push(method: WalletsCommandGet[0], callback: WalletsCommandGet[1]): any;

    /**
     * Register one or more wallets. This emits a `register` event.
     *
     * @param method  'register'
     * @param wallets One or more wallets to register.
     */
    push(method: WalletsCommandRegister[0], wallets: WalletsCommandRegister[1]): any;

    /**
     * Add an event listener to subscribe to events.
     *
     * @param method   'on'
     * @param event    Event name to listen for.
     * @param listener Function that will be called when the event is emitted.
     * @param callback Function that will be called with a function to remove the event listener and unsubscribe.
     */
    push(
        method: WalletsCommandOn[0],
        event: WalletsCommandOn[1],
        listener: WalletsCommandOn[2],
        callback: WalletsCommandOn[3]
    ): any;
}>;
