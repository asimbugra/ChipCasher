import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, Transaction } from "@solana/web3.js";
import { findReference, FindReferenceError } from "@solana/pay";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import BackLink from "../components/BackLink";
import Loading from "../components/Loading";
import { MakeTransactionInputData, MakeTransactionOutputData } from "./api/makeTransaction";
import { WalletSendTransactionError } from "@solana/wallet-adapter-base";

// Dynamic import to prevent SSR issues
const WalletMultiButtonDynamic = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function Checkout() {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // State to hold API response fields
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Read the URL query (which includes our chosen products)
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(router.query)) {
    if (value) {
      if (Array.isArray(value)) {
        for (const v of value) {
          searchParams.append(key, v);
        }
      } else {
        searchParams.append(key, value);
      }
    }
  }

  // Generate the unique reference which will be used for this transaction
  const reference = useMemo(() => Keypair.generate().publicKey, []);

  // Add it to the params we'll pass to the API
  searchParams.append('reference', reference.toString());

  // Retry mechanism for fetching the transaction
  async function getTransactionWithRetry(retries = 3, delay = 1000) {
    if (!publicKey) return;

    setLoading(true);
    setError(null);  // Clear previous errors
    console.log('Requesting /api/makeTransaction with parameters:', searchParams.toString());

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const body: MakeTransactionInputData = {
          account: publicKey.toString(),
        };

        console.log('Request body:', body);

        const response = await fetch(`/api/makeTransaction?${searchParams.toString()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response from API:', errorText);
          throw new Error(`API response error: ${response.status} - ${errorText}`);
        }

        const json = await response.json() as MakeTransactionOutputData;

        // Deserialize the transaction from the response
        const transaction = Transaction.from(Buffer.from(json.transaction, "base64"));
        setTransaction(transaction);
        setMessage(json.message);
        console.log('Transaction fetched and deserialized:', transaction);
        break; // Success, exit the loop

      } catch (e) {
        console.error('Transaction fetch error:', e);
        setError('Failed to fetch transaction. Please try again.');

        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          console.error('Transaction fetch failed after multiple attempts:', e);
          setError('Unable to fetch transaction after multiple attempts.');
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    getTransactionWithRetry();
  }, [publicKey]);

  // Send the fetched transaction to the connected wallet
  async function trySendTransaction() {
    if (!transaction) {
      console.error('Transaction is not available');
      setError('Transaction is not available. Please try again.');
      return;
    }
    
    try {
      console.log('Sending transaction:', transaction);

      const signature = await sendTransaction(transaction, connection);
      console.log('Transaction sent with signature:', signature);

      const confirmation = await connection.confirmTransaction(signature, 'processed');
      console.log('Transaction confirmed:', confirmation);
    } catch (e) {
      console.error('Error sending transaction:', e);

      if (e instanceof WalletSendTransactionError) {
        // Log specific wallet error details
        console.error('WalletSendTransactionError details:', e.message, e);
      } else if (e instanceof Error) {
        console.error('Unexpected error details:', e.message, e.stack);
      }

      setError('Failed to send transaction. Please check your wallet and try again.');
    }
  }

  useEffect(() => {
    if (transaction) {
      trySendTransaction();
    }
  }, [transaction, connection, sendTransaction]);

  // Check transaction status every 2 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await findReference(connection, reference);
        router.push('/confirmed');
      } catch (e) {
        if (e instanceof FindReferenceError) {
          return;
        }
        console.error('Unknown error while checking transaction status', e);
        setError('An error occurred while checking transaction status. Please try again.');
      }
    }, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [connection, reference, router]);

  if (!publicKey) {
    return (
      <div className='flex flex-col items-center gap-8'>
        <div><BackLink href='/'>Cancel</BackLink></div>
        <WalletMultiButtonDynamic />
        <p>You need to connect your wallet to make transactions</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-8'>
      <div><BackLink href='/'>Cancel</BackLink></div>
      <WalletMultiButtonDynamic />
      {loading ? (
        <p>Creating transaction... <Loading /></p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : message ? (
        <p>{message} Please approve the transaction using your wallet</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
