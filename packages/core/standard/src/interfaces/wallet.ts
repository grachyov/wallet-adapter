/**
 * Versions of the Wallet API.
 */
export enum WalletVersion {
    /**
     * Initial version.
     */
    '1.0.0' = '1.0.0',
}

/**
 * Chains supported by wallets for accounts and transactions.
 */
export enum WalletChain {
    /**
     * Solana Mainnet (beta), e.g. https://api.mainnet-beta.solana.com
     */
    SolanaMainnet = 'solana:mainnet',

    /**
     * Solana Devnet, e.g. https://api.devnet.solana.com
     */
    SolanaDevnet = 'solana:devnet',

    /**
     * Solana Testnet, e.g. https://api.testnet.solana.com
     */
    SolanaTestnet = 'solana:testnet',
}

/**
 * Ciphers supported by wallets for encryption and decryption.
 */
export enum WalletCipher {
    /**
     * Default for NaCl.
     */
    'x25519-xsalsa20-poly1305' = 'x25519-xsalsa20-poly1305',
}

/**
 * A readonly byte array.
 */
export type Bytes = Readonly<Uint8Array>;

/**
 * Events emitted by wallets.
 */
export interface WalletEvents {
    // TODO: figure out `accounts` on Wallet
    /**
     * Emitted when the accounts in the wallet are added or removed.
     * An app can listen for this event and call `connect` without arguments to request accounts again.
     */
    accountsChanged(): void;

    /**
     * Emitted when the chains the wallet supports are changed.
     * This can happen if the wallet supports adding chains, like Metamask.
     */
    chainsChanged(): void;
}

/**
 * TODO: docs
 */
export type Wallet = Readonly<{
    /**
     * Version of the Wallet API.
     */
    version: WalletVersion;

    /**
     * Name of the wallet.
     * This will be displayed by Wallet Adapter and apps.
     * It should be canonical to the wallet extension.
     */
    name: string;

    /**
     * Icon of the wallet.
     * This will be displayed by Wallet Adapter and apps.
     * It should be a data URL containing a base64-encoded SVG or PNG image.
     */
    icon: string;

    // TODO: figure out `accountsChanged` event
    /**
     * List the accounts the app is authorized to use.
     * This can be set by the wallet so the app can use authorized accounts on the initial page load.
     */
    accounts: Readonly<WalletAccount[]>;

    /**
     * List the chains supported for simulating and sending transactions.
     */
    chains: Readonly<WalletChain[]>;

    /**
     * List the ciphers supported for encryption and decryption.
     */
    ciphers: Readonly<WalletCipher[]>;

    /**
     * Connect to one or more accounts in the wallet.
     *
     * @param options Options to configure connecting.
     *
     * @return Result of connecting.
     */
    connect(options?: ConnectOptions): Promise<ConnectResult>;

    /**
     * Add an event listener to subscribe to events.
     *
     * @param event    Event name to listen for.
     * @param listener Function that will be called when the event is emitted.
     *
     * @return Function to remove the event listener and unsubscribe.
     */
    on<E extends keyof WalletEvents>(event: E, listener: WalletEvents[E]): () => void;
}>;

/**
 * Options to configure connecting.
 */
export type ConnectOptions = Readonly<{
    /**
     * Optional chain to discover accounts using. Default to whatever the wallet wants.
     */
    chain?: WalletChain;

    /**
     * One or more optional public keys of the accounts in the wallet to authorize an app to use.
     *
     * If public keys are provided:
     *   - The wallet must return only the accounts requested.
     *   - If any account isn't found, or authorization is refused for any account, TODO: determine desired behavior -- is it better to fail, or return a subset?
     *   - If the wallet has already authorized the app to use all the accounts requested, they should be returned without prompting the user.
     *   - If the `silent` option is not provided or `false`, the wallet may prompt the user if needed to authorize accounts.
     *   - If the `silent` option is `true`, the wallet must not prompt the user, and should return requested accounts the app is authorized to use.
     *
     * If no public keys are provided:
     *   - If the `silent` option is not provided or `false`, the wallet should prompt the user to select accounts to authorize the app to use.
     *   - If the `silent` option is `true`, the wallet must not prompt the user, and should return any accounts the app is authorized to use.
     */
    publicKeys?: Bytes[];

    /**
     * Set to true to request the authorized accounts without prompting the user.
     * The wallet should return only the accounts that the app is already authorized to connect to.
     */
    silent?: boolean;
}>;

/**
 * Result of connecting.
 */
export type ConnectResult = Readonly<{
    /**
     * List of accounts in the wallet that the app has been authorized to use.
     */
    accounts: WalletAccount[];

    /**
     * Will be true if there are more accounts in the wallet besides the `accounts` returned.
     * Apps may choose to notify the user or periodically call `connect` again to request more accounts.
     */
    hasMoreAccounts: boolean;
}>;

/**
 * An account in the wallet that the app has been authorized to use.
 */
export type WalletAccount = Readonly<{
    /**
     * Public key of the account, corresponding with the secret key to sign, encrypt, or decrypt using.
     */
    publicKey: Bytes;

    /**
     * Sign one or more serialized transactions using the account's secret key.
     * The transactions may already be partially signed, and may even have a "primary" signature.
     * This method covers existing `signTransaction` and `signAllTransactions` functionality, matching the SMS Mobile Wallet Adapter SDK.
     *
     * @param transactions One or more serialized transactions.
     * @param options      Options to configure signing transactions.
     *
     * @return Result of signing one or more transactions.
     */
    signTransaction(transactions: Bytes[], options?: SignTransactionOptions): Promise<SignTransactionResult>;

    /**
     * Sign one or more serialized transactions using the account's secret key and send them to the network.
     * The transactions may already be partially signed, and may even have a "primary" signature.
     * This method covers existing `signAndSendTransaction` functionality, and also provides an `All` version of the same, matching the SMS Mobile Wallet Adapter SDK.
     *
     * @param transactions One or more serialized transactions.
     * @param options      Options to configure signing and sending transactions.
     *
     * @return Result of signing and sending one or more transactions.
     */
    signAndSendTransaction(
        transactions: Bytes[],
        options?: SignAndSendTransactionOptions
    ): Promise<SignAndSendTransactionResult>;

    /**
     * Sign one or more messages using the account's secret key.
     * TODO: determine prefixing behavior, edit readme
     *
     * @param messages One or more messages to sign.
     *
     * @return Result of signing.
     */
    signMessage(messages: Bytes[]): Promise<SignMessageResult>;

    /**
     * Encrypt one or more cleartexts using the account's secret key.
     *
     * @param publicKey  Public key to derive a shared key to encrypt the data using.
     * @param cleartexts One or more cleartexts to encrypt.
     * @param options    Options to configure encryption.
     *
     * @return Result of encryption.
     */
    encrypt(publicKey: Bytes, cleartexts: Bytes[], options?: EncryptOptions): Promise<EncryptResult>;

    /**
     * Decrypt one or more ciphertexts using the account's secret key.
     *
     * @param publicKey   Public key to derive a shared key to decrypt the data using.
     * @param ciphertexts One or more ciphertexts to decrypt.
     * @param nonces      One or more nonces to use.
     * @param options     Options to configure decryption.
     *
     * @return Result of decryption.
     */
    decrypt(publicKey: Bytes, ciphertexts: Bytes[], nonces: Bytes[], options?: DecryptOptions): Promise<DecryptResult>;
}>;

/**
 * Options to configure signing transactions.
 */
export type SignTransactionOptions = Readonly<{
    /**
     * Optional chain to simulate the transaction using. Default to whatever the wallet wants.
     */
    chain?: WalletChain;
}>;

/**
 * Result of signing one or more transactions.
 */
export type SignTransactionResult = Readonly<{
    /**
     * One or more signed, serialized transactions.
     * Return transactions rather than signatures allows multisig wallets, program wallets, and other wallets that use
     * meta-transactions to return a modified, signed transaction.
     */
    transactions: Bytes[];
}>;

/**
 * Options to configure signing and sending transactions.
 */
export type SignAndSendTransactionOptions = Readonly<{
    /**
     * Optional chain to simulate and send the transaction using. Default to whatever the wallet wants.
     */
    chain?: WalletChain;
}>;

/**
 * Result of signing and sending one or more transactions.
 */
export type SignAndSendTransactionResult = Readonly<{
    /**
     * One or more "primary" transaction signatures, as raw bytes.
     * We return raw bytes to avoid ambiguity or dependencies related to the signature encoding.
     */
    signatures: Bytes[];
}>;

/**
 * Result of signing.
 */
export type SignMessageResult = Readonly<{
    /**
     * One or more signatures, as raw bytes.
     * We return raw bytes to avoid ambiguity or dependencies related to the signature encoding.
     */
    signatures: Bytes[];
}>;

/**
 * Options to configure encryption.
 */
export type EncryptOptions = Readonly<{
    /**
     * Optional cipher to use. Default to whatever the wallet wants.
     */
    cipher?: WalletCipher;
}>;

/**
 * Result of encryption.
 */
export type EncryptResult = Readonly<{
    /**
     * One or more ciphertexts that were encrypted, corresponding with the cleartexts provided.
     */
    ciphertexts: Bytes[];
    /**
     * One or more nonces that were used for encryption, corresponding with each ciphertext.
     */
    nonces: Bytes[];
    /**
     * Cipher that was used for encryption.
     */
    cipher: WalletCipher;
}>;

/**
 * Options to configure decryption.
 */
export type DecryptOptions = Readonly<{
    /**
     * Optional cipher to use. Default to whatever the wallet wants.
     */
    cipher?: WalletCipher;
}>;

/**
 * Result of decryption.
 */
export type DecryptResult = Readonly<{
    /**
     * One or more cleartexts that were decrypted, corresponding with the ciphertexts provided.
     */
    cleartexts: Bytes[];
    /**
     * Cipher that was used for decryption.
     */
    cipher: WalletCipher;
}>;
