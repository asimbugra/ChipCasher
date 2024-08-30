import { createQR, encodeURL, TransactionRequestURLFields, findReference, validateTransfer, FindReferenceError, ValidateTransferError } from "@solana/pay";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef } from "react";
import BackLink from "../../components/BackLink";
import PageHeading from "../../components/PageHeading";
import { shopAddress, usdcAddress } from "../../lib/addresses";
import calculatePrice from "../../lib/calculatePrice";

export default function Checkout() {
  const router = useRouter();

  // ref to a div where we'll show the QR code
  const qrRef = useRef<HTMLDivElement>(null);

  const amount = useMemo(() => calculatePrice(router.query), [router.query]);

  // Unique address that we can listen for payments to
  const reference = useMemo(() => Keypair.generate().publicKey, []);

  // Read the URL query (which includes our chosen products)
  const searchParams = useMemo(() => {
    const params = new URLSearchParams({ reference: reference.toString() });
    for (const [key, value] of Object.entries(router.query)) {
      if (value) {
        if (Array.isArray(value)) {
          for (const v of value) {
            params.append(key, v);
          }
        } else {
          params.append(key, value);
        }
      }
    }
    return params;
  }, [router.query, reference]);

  // Get a connection to Solana devnet
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);
  const connection = useMemo(() => new Connection(endpoint), [endpoint]);

  // Show the QR code
  useEffect(() => {
    if (typeof window !== 'undefined' && qrRef.current) { // Check if we're in the browser
      const { location } = window;
      const apiUrl = `${location.protocol}//${location.host}/api/makeTransaction?${searchParams.toString()}`;
      const urlParams: TransactionRequestURLFields = {
        link: new URL(apiUrl),
        label: "ChipCasher",
        message: "Thanks for your order! 🛍️",
      };
      const solanaUrl = encodeURL(urlParams);
      const qr = createQR(solanaUrl, 512, 'transparent');

      if (amount.isGreaterThan(0)) {
        qrRef.current.innerHTML = ''; // Clear previous QR code
        qr.append(qrRef.current);
      }
    }
  }, [amount, searchParams]);

  // Check every 0.5s if the transaction is completed
  useEffect(() => {
    if (typeof window === 'undefined') return; // Only run in the browser

    const interval = setInterval(async () => {
      try {
        // Check if there is any transaction for the reference
        const signatureInfo = await findReference(connection, reference, { finality: 'confirmed' });

        // Validate that the transaction has the expected recipient, amount, and SPL token
        await validateTransfer(
          connection,
          signatureInfo.signature,
          {
            recipient: shopAddress,
            amount,
            splToken: usdcAddress,
            reference,
          },
          { commitment: 'confirmed' }
        );

        // Redirect to the confirmation page
        router.push('/shop/confirmed');
      } catch (e) {
        if (e instanceof FindReferenceError) {
          // No transaction found yet, ignore this error
          return;
        }
        if (e instanceof ValidateTransferError) {
          // Transaction is invalid
          console.error('Transaction is invalid', e);
          return;
        }
        console.error('Unknown error', e);
      }
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [connection, reference, router, amount]);

  return (
    <div className="flex flex-col items-center gap-8">
      <BackLink href='/shop'>Cancel</BackLink>

      <PageHeading>Checkout ${amount.toString()}</PageHeading>

      {/* div added to display the QR code */}
      <div ref={qrRef} />
    </div>
  );
}
