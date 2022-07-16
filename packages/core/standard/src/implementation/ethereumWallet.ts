import ethers from 'ethers';
import { box, randomBytes } from 'tweetnacl';
import {
    Bytes,
    ConnectInput,
    ConnectOutput,
    DecryptInput,
    DecryptOutput,
    EncryptInput,
    EncryptOutput,
    SignAndSendTransactionInput,
    SignAndSendTransactionOutput,
    SignMessageInput,
    SignMessageOutput,
    SignTransactionInput,
    SignTransactionOutput,
    Wallet,
    WalletAccount,
    WalletChain,
    WalletCipher,
    WalletEvents,
    WalletVersion,
} from '../interfaces';

export class EthereumWallet implements Wallet {
    version = WalletVersion['1.0.0'];

    accounts = [new EthereumWalletAccount()];
    chains = [WalletChain.Ethereum];
    ciphers = [WalletCipher['x25519-xsalsa20-poly1305']];

    name = 'Ethereum Wallet';
    icon =
        'data:image/svg+xml;base64,PHN2ZyBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgaW1hZ2UtcmVuZGVyaW5nPSJvcHRpbWl6ZVF1YWxpdHkiIHNoYXBlLXJlbmRlcmluZz0iZ2VvbWV0cmljUHJlY2lzaW9uIiB0ZXh0LXJlbmRlcmluZz0iZ2VvbWV0cmljUHJlY2lzaW9uIiB2aWV3Qm94PSIwIDAgNzg0LjM3IDEyNzcuMzkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbC1ydWxlPSJub256ZXJvIj48cGF0aCBkPSJtMzkyLjA3IDAtOC41NyAyOS4xMXY4NDQuNjNsOC41NyA4LjU1IDM5Mi4wNi0yMzEuNzV6IiBmaWxsPSIjMzQzNDM0Ii8+PHBhdGggZD0ibTM5Mi4wNyAwLTM5Mi4wNyA2NTAuNTQgMzkyLjA3IDIzMS43NXYtNDA5Ljk2eiIgZmlsbD0iIzhjOGM4YyIvPjxwYXRoIGQ9Im0zOTIuMDcgOTU2LjUyLTQuODMgNS44OXYzMDAuODdsNC44MyAxNC4xIDM5Mi4zLTU1Mi40OXoiIGZpbGw9IiMzYzNjM2IiLz48cGF0aCBkPSJtMzkyLjA3IDEyNzcuMzh2LTMyMC44NmwtMzkyLjA3LTIzMS42M3oiIGZpbGw9IiM4YzhjOGMiLz48cGF0aCBkPSJtMzkyLjA3IDg4Mi4yOSAzOTIuMDYtMjMxLjc1LTM5Mi4wNi0xNzguMjF6IiBmaWxsPSIjMTQxNDE0Ii8+PHBhdGggZD0ibTAgNjUwLjU0IDM5Mi4wNyAyMzEuNzV2LTQwOS45NnoiIGZpbGw9IiMzOTM5MzkiLz48L2c+PC9zdmc+';

    private _listeners: { [E in keyof WalletEvents]?: WalletEvents[E][] } = {};

    async connect(options?: ConnectInput): Promise<ConnectOutput> {
        return {
            accounts: this.accounts,
            hasMoreAccounts: false,
        };
    }

    on<E extends keyof WalletEvents>(event: E, listener: WalletEvents[E]): () => void {
        this._listeners[event]?.push(listener) || (this._listeners[event] = [listener]);

        return (): void => this._off(event, listener);
    }

    private _emit<E extends keyof WalletEvents>(event: E) {
        this._listeners[event]?.forEach((listener) => listener());
    }

    private _off<E extends keyof WalletEvents>(event: E, listener: WalletEvents[E]) {
        this._listeners[event] = this._listeners[event]?.filter((l) => listener !== l);
    }
}

export class EthereumWalletAccount implements WalletAccount {
    private _wallet: ethers.Wallet;
    private _address: Bytes;
    private _publicKey: Bytes;
    private _secretKey: Bytes;

    get address(): Bytes {
        return this._address;
    }

    get publicKey(): Bytes {
        return this._publicKey;
    }

    get chain(): WalletChain {
        return WalletChain.Ethereum;
    }

    constructor() {
        this._wallet = ethers.Wallet.createRandom();
        this._address = ethers.utils.arrayify(this._wallet.address);
        this._publicKey = ethers.utils.arrayify(this._wallet.publicKey);
        this._secretKey = ethers.utils.arrayify(this._wallet.privateKey);
    }

    async signTransaction(input: SignTransactionInput): Promise<SignTransactionOutput> {
        const signedTransactions = await Promise.all(
            input.transactions.map(async (rawTransaction) => {
                const transaction = ethers.utils.parseTransaction(rawTransaction);

                const signedTransaction = await this._wallet.signTransaction({
                    ...transaction,
                    // HACK: signTransaction expects a `number` or `undefined`, not `null`
                    type: transaction.type ?? undefined,
                });

                return ethers.utils.arrayify(signedTransaction);
            })
        );

        return { signedTransactions };
    }

    async signAndSendTransaction(input: SignAndSendTransactionInput): Promise<SignAndSendTransactionOutput> {
        // homestead == Ethereum Mainnet
        const wallet = this._wallet.connect(ethers.getDefaultProvider('homestead'));

        const signatures = await Promise.all(
            input.transactions.map(async (rawTransaction) => {
                const transaction = ethers.utils.parseTransaction(rawTransaction);

                const { hash } = await wallet.sendTransaction({
                    ...transaction,
                    // HACK: signTransaction expects a `number` or `undefined`, not `null`
                    type: transaction.type ?? undefined,
                });

                return ethers.utils.arrayify(hash);
            })
        );

        return { signatures };
    }

    async signMessage(input: SignMessageInput): Promise<SignMessageOutput> {
        const signatures = await Promise.all(
            input.messages.map(async (message) => {
                const signature = await this._wallet.signMessage(message);
                return ethers.utils.arrayify(signature);
            })
        );

        return { signatures };
    }

    async encrypt(inputs: EncryptInput[]): Promise<EncryptOutput[]> {
        return inputs.map(({ publicKey, cleartexts }) => {
            const sharedKey = box.before(publicKey, this._secretKey);

            const nonces = [];
            const ciphertexts = [];
            for (let i = 0; i < cleartexts.length; i++) {
                nonces[i] = randomBytes(32);
                ciphertexts[i] = box.after(cleartexts[i], nonces[i], sharedKey);
            }

            return { ciphertexts, nonces, cipher: WalletCipher['x25519-xsalsa20-poly1305'] };
        });
    }

    async decrypt(inputs: DecryptInput[]): Promise<DecryptOutput[]> {
        return inputs.map(({ publicKey, ciphertexts, nonces }) => {
            const sharedKey = box.before(publicKey, this._secretKey);

            const cleartexts = [];
            for (let i = 0; i < cleartexts.length; i++) {
                const cleartext = box.open.after(ciphertexts[i], nonces[i], sharedKey);
                if (!cleartext) throw new Error('message authentication failed');
                cleartexts[i] = cleartext;
            }

            return { cleartexts, cipher: WalletCipher['x25519-xsalsa20-poly1305'] };
        });
    }
}
