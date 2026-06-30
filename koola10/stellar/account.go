package stellar

import (
	"github.com/stellar/go/clients/horizonclient"
	"github.com/stellar/go/keypair"
)

func CreateAccount() (string, string, error) {
	pair, err := keypair.Random()
	if err != nil {
		return "", "", err
	}

	// Fund the account using Friendbot on Testnet
	_, err = horizonclient.DefaultTestNetClient.Fund(pair.Address())
	if err != nil {
		return pair.Address(), pair.Seed(), err
	}

	return pair.Address(), pair.Seed(), nil
}
