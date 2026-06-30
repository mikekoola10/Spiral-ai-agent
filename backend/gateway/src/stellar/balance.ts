import { server } from './client.js';

export async function checkBalance(publicKey: string): Promise<any[]> {
    try {
        const account = await server.loadAccount(publicKey);
        return account.balances;
    } catch (e) {
        console.error('Error loading account:', e);
        throw e;
    }
}
