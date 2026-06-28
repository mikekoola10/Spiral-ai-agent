import * as StellarSdk from '@stellar/stellar-sdk';
import { server, getKeypair } from './client.js';

export async function sendPayment(destination: string, amount: string, asset: StellarSdk.Asset = StellarSdk.Asset.native()) {
    const sourceKeys = getKeypair();

    try {
        const account = await server.loadAccount(sourceKeys.publicKey());

        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: (await server.fetchBaseFee()).toString(),
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .addOperation(StellarSdk.Operation.payment({
                destination,
                asset,
                amount,
            }))
            .setTimeout(30)
            .build();

        transaction.sign(sourceKeys);
        const result = await server.submitTransaction(transaction);
        return result.hash;
    } catch (e) {
        console.error('Error sending payment:', e);
        throw e;
    }
}
