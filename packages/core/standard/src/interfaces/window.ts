import { Wallet } from './wallet';

/**
 * Browser window containing a global `wallets` object.
 */
export interface WalletsWindow extends Window {
    /**
     * Global `wallets` object.
     */
    wallets?: Wallets | WalletsCommand[];
}

/**
 * Global `wallets` object API.
 */
export type Wallets = Readonly<{
    /**
     * TODO: docs
     *
     * @param commands TODO: docs
     */
    push(...commands: WalletsCommand[]): void;
}>;

/** TODO: docs */
export type WalletsCommand = WalletsCommandGet | WalletsCommandRegister | WalletsCommandOn;

/**
 * Get the wallets that have been registered.
 */
export interface WalletsCommandGet {
    /**
     * TODO: docs
     */
    method: 'get';

    /**
     * Function that will be called with all wallets that have been registered.
     */
    callback: (wallets: readonly Wallet[]) => void;
}

/**
 * Register wallets. This emits a `register` event.
 */
export interface WalletsCommandRegister {
    /**
     * TODO: docs
     */
    method: 'register';

    /**
     * Wallets to register.
     */
    wallets: readonly Wallet[];
}

/**
 * Add an event listener to subscribe to events.
 */
export interface WalletsCommandOn<E extends keyof WalletsEvents = keyof WalletsEvents> {
    /**
     * TODO: docs
     */
    method: 'on';

    /**
     * Event name to listen for.
     */
    event: E;

    /**
     * Function that will be called when the event is emitted.
     */
    listener: WalletsEvents[E];

    /**
     * Function that will be called with a function to remove the event listener and unsubscribe.
     */
    callback: (unsubscribe: () => void) => void;
}

/**
 * Events emitted by the global `wallets` object.
 */
export interface WalletsEvents {
    /**
     * Emitted when wallets are registered.
     *
     * @param wallets Wallets that were registered.
     */
    register(...wallets: Wallet[]): void;
}
