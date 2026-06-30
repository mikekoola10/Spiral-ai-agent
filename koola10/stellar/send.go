package stellar

import (
	"github.com/stellar/go/clients/horizonclient"
	"github.com/stellar/go/network"
	"github.com/stellar/go/txnbuild"
)

func SendPayment(destAddress string, amount string, asset txnbuild.Asset) (string, error) {
	client := GetClient()
	kp, err := GetKeyPair()
	if err != nil {
		return "", err
	}

	request := horizonclient.AccountRequest{AccountID: kp.Address()}
	account, err := client.AccountDetail(request)
	if err != nil {
		return "", err
	}

	tx, err := txnbuild.NewTransaction(
		txnbuild.TransactionParams{
			SourceAccount:        &account,
			IncrementSequenceNum: true,
			BaseFee:              txnbuild.MinBaseFee,
			Preconditions:        txnbuild.Preconditions{TimeBounds: txnbuild.NewInfiniteTimeout()},
			Operations: []txnbuild.Operation{
				&txnbuild.Payment{
					Destination: destAddress,
					Amount:      amount,
					Asset:       asset,
				},
			},
		},
	)

	if err != nil {
		return "", err
	}

	signedTx, err := tx.Sign(network.TestNetworkPassphrase, kp)
	if err != nil {
		return "", err
	}

	txeBase64, err := signedTx.Base64()
	if err != nil {
		return "", err
	}

	resp, err := client.SubmitTransactionXDR(txeBase64)
	if err != nil {
		return "", err
	}

	return resp.Hash, nil
}
