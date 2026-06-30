import * as StellarSdk from '@stellar/stellar-sdk';

export const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

export function getKeypair() {
    const secret = process.env.STELLAR_SECRET_KEY;
    if (!secret) {
        throw new Error('STELLAR_SECRET_KEY is not set');
    }
    return StellarSdk.Keypair.fromSecret(secret);
}

export function getPublicKey() {
    return process.env.STELLAR_PUBLIC_KEY;
}
