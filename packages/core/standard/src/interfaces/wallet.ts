/**
 * Versions of the Wallet API.
 */
import { UnionToIntersection } from './typescript';

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

    /**
     * Ethereum (mainnet)
     */
    Ethereum = 'ethereum:1',
}

/**
 * Ciphers supported by wallets for encryption and decryption.
 */
export enum WalletCipher {
    /**
     * Default in NaCl.
     * Curve25519 scalar multiplication, Salsa20 secret-key encryption, and Poly1305 one-time authentication.
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
export interface WalletEvent {
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

type SolanaWalletThatCanEncryptAndOrDecrypt = Wallet<SolanaWalletAccountThatCanEncryptAndOrDecrypt>;

type SolanaWalletAccountThatCanEncryptAndOrDecrypt = WalletAccount<
    WalletChain.SolanaMainnet,
    // NOTE: declare that this will implement encrypt and / or decrypt methods
    EncryptPermission | DecryptPermission | {}
>;

// NOTE: A dummy instance of the wallet to inspect type safety of
const wallet = {} as SolanaWalletThatCanEncryptAndOrDecrypt;

const connectToSolanaWalletWithOnlyEncryptPermission = await wallet.connect({
    // NOTE: This should fail, because Ethereum is not in the set of chains supported by accounts of this wallet instance
    chains: [WalletChain.Ethereum],
    // NOTE: This should succeed, because 'encrypt' is one of the permissions available for accounts of this wallet instance ...
    //       but right now, the type of `permissions` is also incorrectly including the properties of `WalletAccount` (address, chain, publicKey)
    permissions: ['encrypt'],
});

// NOTE: This should succeed, because the subset of accounts returned can encrypt, and I've requested permission to encrypt
connectToSolanaWalletWithOnlyEncryptPermission.accounts[0].encrypt;

// NOTE: This should fail, because the subset of accounts returned can only encrypt, even though the superset can encrypt and decrypt
connectToSolanaWalletWithOnlyEncryptPermission.accounts[0].decrypt;

type ChainOfAccount<Account> = Account extends WalletAccount<infer Chain, any> ? Chain : never;

type PermissionOfAccount<Account> = Account extends WalletAccount<any, infer Permission> ? Permission : never;

/** TODO: docs */
export type Wallet<
    Account extends WalletAccount<Chain, Permission>,
    Event extends WalletEvent = WalletEvent,
    Cipher extends string = WalletCipher,
    Version extends string = WalletVersion,
    // NOTE: infer the set of chains and permissions supported from the type of accounts supported
    Chain = ChainOfAccount<Account>,
    Permission = PermissionOfAccount<Account>
> = Readonly<{
    /**
     * Version of the Wallet API.
     */
    version: Version;

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

    /**
     * List the accounts the app is authorized to use.
     * This can be set by the wallet so the app can use authorized accounts on the initial page load.
     */
    accounts: readonly Account[];

    /**
     * List the chains supported for signing, simulating, and sending transactions.
     * This can be updated by the wallet, which will emit a `chainsChanged` event when this occurs.
     */
    chains: readonly Chain[];

    /**
     * List the ciphers supported for encryption and decryption.
     */
    ciphers: readonly Cipher[];

    /**
     * Connect to accounts in the wallet.
     *
     * @param input Input for connecting.
     *
     * @return Output of connecting.
     */
    // NOTE: what I want to express here (and don't know how to do) is this:
    //       of the set of accounts, chains, and permissions available within the wallet ...
    //       select some subset of accounts, providing a set of chains and permissions ...
    //       such that ConnectInput's `chains` are the chains provided to the connect method ...
    //       and ConnectInput's `permissions` are the keys of the permissions provided to the connect method ...
    //       such that ConnectOutput's `accounts` will strictly belong to the chains and permissions provided
    connect<C extends Chain, P extends Permission>(
        input: ConnectInput<Account, C, P>
    ): Promise<ConnectOutput<Account, C, P>>;

    /**
     * Add an event listener to subscribe to events.
     *
     * @param event    Event name to listen for.
     * @param listener Function that will be called when the event is emitted.
     *
     * @return Function to remove the event listener and unsubscribe.
     */
    on<E extends keyof Event>(event: E, listener: Event[E]): () => void;
}>;

/**
 * Input for connecting.
 */
export type ConnectInput<
    Account extends WalletAccount<Chain, Permission>,
    Chain extends string = ChainOfAccount<Account>,
    Permission extends WalletAccountPermission = PermissionOfAccount<Account>
> = Readonly<{
    /**
     * Chains to discover accounts using.
     */
    chains: Chain[];

    /**
     * Optional account permissions to request authorization for.
     */
    permissions?: Array<keyof Permission>;

    /**
     * Optional public key addresses of the accounts in the wallet to authorize an app to use.
     *
     * If addresses are provided:
     *   - The wallet must return only the accounts requested.
     *   - If any account isn't found, or authorization is refused for any account, TODO: determine desired behavior -- is it better to fail, or return a subset?
     *   - If the wallet has already authorized the app to use all the accounts requested, they should be returned without prompting the user.
     *   - If the `silent` option is not provided or `false`, the wallet may prompt the user if needed to authorize accounts.
     *   - If the `silent` option is `true`, the wallet must not prompt the user, and should return requested accounts the app is authorized to use.
     *
     * If no addresses are provided:
     *   - If the `silent` option is not provided or `false`, the wallet should prompt the user to select accounts to authorize the app to use.
     *   - If the `silent` option is `true`, the wallet must not prompt the user, and should return any accounts the app is authorized to use.
     */
    addresses?: Bytes[];

    /**
     * Set to true to request the authorized accounts without prompting the user.
     * The wallet should return only the accounts that the app is already authorized to connect to.
     */
    silent?: boolean;
}>;

/**
 * Output of connecting.
 */
export type ConnectOutput<
    Account extends WalletAccount<Chain, Permission>,
    Chain extends string = ChainOfAccount<Account>,
    Permission extends WalletAccountPermission = PermissionOfAccount<Account>
> = Readonly<{
    /**
     * List of accounts in the wallet that the app has been authorized to use.
     */
    accounts: Account[];

    /**
     * Will be true if there are more accounts in the wallet besides the `accounts` returned.
     * Apps may choose to notify the user or periodically call `connect` again to request more accounts.
     */
    hasMoreAccounts: boolean;
}>;

/**
 * An account in the wallet that the app has been authorized to use.
 */
export type WalletAccount<Chain extends string, Permission extends WalletAccountPermission> = Permission &
    Readonly<{
        /**
         * Address of the account, corresponding with the public key.
         * This may be the same as the public key on some chains (e.g. Solana), or different on others (e.g. Ethereum).
         */
        address: Bytes;

        /**
         * Public key of the account, corresponding with the secret key to sign, encrypt, or decrypt using.
         */
        publicKey: Bytes;

        /**
         * Chain to sign, simulate, and send transactions using.
         */
        chain: Chain;
    }>;

/** TODO: docs */
export type WalletAccountPermission =
    | SignTransactionPermission
    | SignAndSendTransactionPermission
    | SignMessagePermission
    | EncryptPermission
    | DecryptPermission
    | {};

/** TODO: docs */
export type WalletAccountPermissions = UnionToIntersection<WalletAccountPermission>;

/** TODO: docs */
export type SignTransactionPermission = Readonly<{
    /**
     * Sign transactions using the account's secret key.
     * The transactions may already be partially signed, and may even have a "primary" signature.
     * This method covers existing `signTransaction` and `signAllTransactions` functionality, matching the SMS Mobile Wallet Adapter SDK.
     *
     * @param input Input for signing transactions.
     *
     * @return Output of signing transactions.
     */
    signTransaction(input: SignTransactionInput): Promise<SignTransactionOutput>;
}>;

/**
 * Input for signing transactions.
 */
export type SignTransactionInput = Readonly<{
    /**
     * Serialized transactions, as raw bytes.
     */
    transactions: Bytes[];
}>;

/**
 * Result of signing transactions.
 */
export type SignTransactionOutput = Readonly<{
    /**
     * Signed, serialized transactions, as raw bytes.
     * Return transactions rather than signatures allows multisig wallets, program wallets, and other wallets that use
     * meta-transactions to return a modified, signed transaction.
     */
    signedTransactions: Bytes[];
}>;

/** TODO: docs */
export type SignAndSendTransactionPermission = Readonly<{
    /**
     * Sign transactions using the account's secret key and send them to the network.
     * The transactions may already be partially signed, and may even have a "primary" signature.
     * This method covers existing `signAndSendTransaction` functionality, and also provides an `All` version of the same, matching the SMS Mobile Wallet Adapter SDK.
     *
     * @param input Input for signing and sending transactions.
     *
     * @return Output of signing and sending transactions.
     */
    signAndSendTransaction(input: SignAndSendTransactionInput): Promise<SignAndSendTransactionOutput>;
}>;

/**
 * Input for signing and sending transactions.
 */
export type SignAndSendTransactionInput = Readonly<{
    /**
     * Serialized transactions, as raw bytes.
     */
    transactions: Bytes[];
    // TODO: figure out if options for sending need to be supported
}>;

/**
 * Output of signing and sending transactions.
 */
export type SignAndSendTransactionOutput = Readonly<{
    /**
     * "Primary" transaction signatures, as raw bytes.
     */
    signatures: Bytes[];
}>;

/** TODO: docs */
export type SignMessagePermission = Readonly<{
    /**
     * Sign messages (arbitrary bytes) using the account's secret key.
     *
     * @param input Input for signing messages.
     *
     * @return Output of signing messages.
     */
    signMessage(input: SignMessageInput): Promise<SignMessageOutput>;
}>;

/**
 * Input for signing messages.
 */
export type SignMessageInput = Readonly<{
    /**
     * Messages to sign, as raw bytes.
     */
    messages: Bytes[];
}>;

/**
 * Output of signing one or messages.
 */
export type SignMessageOutput = Readonly<{
    /**
     * Message signatures, as raw bytes.
     */
    signatures: Bytes[];
}>;

/** TODO: docs */
export type EncryptPermission = Readonly<{
    /**
     * Encrypt cleartexts using the account's secret key.
     *
     * @param inputs Inputs for encryption.
     *
     * @return Result of encryption.
     */
    encrypt(inputs: EncryptInput[]): Promise<EncryptOutput[]>;
}>;

/**
 * Input for encryption.
 */
export type EncryptInput = Readonly<{
    /**
     * Public key to derive a shared key to encrypt the data using.
     */
    publicKey: Bytes;

    /**
     * Cleartexts to decrypt.
     */
    cleartexts: Bytes[];

    /**
     * Optional cipher to use for encryption. Default to whatever the wallet wants.
     */
    cipher?: WalletCipher;
}>;

/**
 * Output of encryption.
 */
export type EncryptOutput = Readonly<{
    /**
     * Ciphertexts that were encrypted, corresponding with the cleartexts provided.
     */
    ciphertexts: Bytes[];

    /**
     * Nonces that were used for encryption, corresponding with each ciphertext.
     */
    nonces: Bytes[];

    /**
     * Cipher that was used for encryption.
     */
    cipher: WalletCipher;
}>;

/** TODO: docs */
export type DecryptPermission = Readonly<{
    /**
     * Decrypt ciphertexts using the account's secret key.
     *
     * @param inputs Inputs for decryption.
     *
     * @return Result of decryption.
     */
    decrypt(inputs: DecryptInput[]): Promise<DecryptOutput[]>;
}>;

/**
 * Input for decryption.
 */
export type DecryptInput = Readonly<{
    /**
     * Public key to derive a shared key to decrypt the data using.
     */
    publicKey: Bytes;

    /**
     * Ciphertexts to decrypt.
     */
    ciphertexts: Bytes[];

    /**
     * Nonces to use for decryption, corresponding with each ciphertext.
     */
    nonces: Bytes[];

    /**
     * Cipher to use for decryption.
     */
    cipher: WalletCipher;
}>;

/**
 * Output of decryption.
 */
export type DecryptOutput = Readonly<{
    /**
     * Cleartexts that were decrypted, corresponding with the ciphertexts provided.
     */
    cleartexts: Bytes[];
}>;
