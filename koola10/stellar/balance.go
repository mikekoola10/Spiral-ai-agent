package stellar

import (
	"github.com/stellar/go/clients/horizonclient"
	"github.com/stellar/go/protocols/horizon"
)

func CheckBalance(address string) ([]horizon.Balance, error) {
	client := GetClient()
	request := horizonclient.AccountRequest{AccountID: address}
	account, err := client.AccountDetail(request)
	if err != nil {
		return nil, err
	}
	return account.Balances, nil
}
