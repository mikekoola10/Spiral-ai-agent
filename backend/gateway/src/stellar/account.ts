import * as StellarSdk from '@stellar/stellar-sdk';
import axios from 'axios';

export async function createAccount() {
    const pair = StellarSdk.Keypair.random();

    try {
        // Fund the account using Friendbot on Testnet
        const response = await axios.get(`https://friendbot.stellar.org?addr=${pair.publicKey()}`);
        return {
            publicKey: pair.publicKey(),
            secret: pair.secret(),
            response: response.data
        };
    } catch (e) {
        console.error('Error creating/funding account:', e);
        throw e;
    }
}
