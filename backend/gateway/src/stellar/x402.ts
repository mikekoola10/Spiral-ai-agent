import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as StellarSdk from '@stellar/stellar-sdk';
import { sendPayment } from './send.js';

export async function fetchWithX402(instance: AxiosInstance, config: AxiosRequestConfig) {
    try {
        const response = await instance(config);
        return response;
    } catch (error: any) {
        if (error.response && error.response.status === 402) {
            const paymentInfo = error.response.headers['x-payment-request'];
            if (!paymentInfo) {
                throw error;
            }

            const { destination, amount, asset: assetStr } = JSON.parse(paymentInfo);

            let asset: StellarSdk.Asset;
            if (!assetStr || assetStr === 'native') {
                asset = StellarSdk.Asset.native();
            } else {
                const [code, issuer] = assetStr.split(':');
                asset = new StellarSdk.Asset(code, issuer);
            }

            console.log(`Detected x402: Sending ${amount} ${assetStr} to ${destination}`);
            const txHash = await sendPayment(destination, amount, asset);
            console.log(`x402 payment successful: ${txHash}`);

            // Retry the request with payment credential
            const newConfig = { ...config };
            newConfig.headers = {
                ...newConfig.headers,
                'X-Payment-Credential': txHash
            };

            return instance(newConfig);
        }
        throw error;
    }
}
