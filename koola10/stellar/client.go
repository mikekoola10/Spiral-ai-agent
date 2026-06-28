package stellar

import (
	"os"

	"github.com/stellar/go/clients/horizonclient"
	"github.com/stellar/go/keypair"
)

func GetClient() *horizonclient.Client {
	return horizonclient.DefaultTestNetClient
}

func GetKeyPair() (*keypair.Full, error) {
	secret := os.Getenv("STELLAR_SECRET_KEY")
	return keypair.ParseFull(secret)
}

func GetPublicKey() string {
	return os.Getenv("STELLAR_PUBLIC_KEY")
}
