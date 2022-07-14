import { WalletsWindow } from '../interfaces';
import { SolanaWallet } from './wallet';

// This code will be run by every wallet extension, and also by Wallet Adapter.
// The first one to run will create the `window.wallets` API for the rest to reuse.
declare const window: WalletsWindow;

(function () {
    window.wallets = window.wallets || [];
    window.wallets.push({ method: 'register', wallets: [new SolanaWallet()] });
})();
