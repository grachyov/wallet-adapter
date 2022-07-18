import { WalletsWindow } from '../interfaces';
import { EthereumWallet } from './ethereumWallet';
import { initialize } from './initialize';
import { SolanaWallet } from './solanaWallet';

// This code will be run by every wallet extension, and also by Wallet Adapter.
// The first one to run will create the `window.wallets` API for the rest to reuse.
declare const window: WalletsWindow;

(function () {
    window.wallets = window.wallets || [];
    // The first wallet to load registers itself on the window
    window.wallets.push({ method: 'register', wallets: [new SolanaWallet()] });
    // The second wallet to load registers itself on the window
    window.wallets.push({ method: 'register', wallets: [new EthereumWallet()] });

    // ...

    initialize();

    window.wallets.push({ method: 'on', event: 'register', listener() {}, callback() {} });
    window.wallets.push({ method: 'get', callback(...wallets) {} });
})();
