package stellar

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/stellar/go/txnbuild"
)

type PaymentRequest struct {
	Destination string `json:"destination"`
	Amount      string `json:"amount"`
	Asset       string `json:"asset"` // e.g. "native" or "USDC:Issuer"
}

func FetchWithX402(client *http.Client, req *http.Request) (*http.Response, error) {
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusPaymentRequired {
		paymentHeader := resp.Header.Get("X-Payment-Request")
		if paymentHeader == "" {
			return resp, nil // No payment info provided
		}

		var pr PaymentRequest
		err := json.Unmarshal([]byte(paymentHeader), &pr)
		if err != nil {
			return resp, fmt.Errorf("failed to parse X-Payment-Request: %w", err)
		}

		// Map asset string to txnbuild.Asset
		var asset txnbuild.Asset
		if pr.Asset == "native" || pr.Asset == "" {
			asset = txnbuild.NativeAsset{}
		} else {
			parts := strings.Split(pr.Asset, ":")
			if len(parts) == 2 {
				asset = txnbuild.CreditAsset{Code: parts[0], Issuer: parts[1]}
			} else {
				asset = txnbuild.NativeAsset{}
			}
		}

		fmt.Printf("Detected x402: Sending %s %s to %s\n", pr.Amount, pr.Asset, pr.Destination)
		txHash, err := SendPayment(pr.Destination, pr.Amount, asset)
		if err != nil {
			return resp, fmt.Errorf("x402 payment failed: %w", err)
		}
		fmt.Printf("x402 payment successful: %s\n", txHash)

		// Retry the request with payment credential
		newReq := req.Clone(req.Context())
		newReq.Header.Set("X-Payment-Credential", txHash)

		return client.Do(newReq)
	}

	return resp, nil
}
