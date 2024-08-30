import { createTransferCheckedInstruction, getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";
import { shopAddress, usdcAddress } from "../../lib/addresses"; // Ensure these are correctly defined
import calculatePrice from "../../lib/calculatePrice"; // Ensure this utility function is correctly defined

export type MakeTransactionInputData = {
  account: string;
};

export type MakeTransactionOutputData = {
  transaction: string;
  message: string;
};

type ErrorOutput = {
  error: string;
};

// Helper function to handle GET requests
function get(res: NextApiResponse) {
  res.status(200).json({
    label: "ChipCasher",
    icon: "https://freesvg.org/plastic-water-bottle",
  });
}

// Helper function to handle POST requests
async function post(req: NextApiRequest, res: NextApiResponse<MakeTransactionOutputData | ErrorOutput>) {
  try {
    // Calculate the expected cost
    const amount = calculatePrice(req.query);
    console.log('Calculated amount:', amount.toString());

    if (amount.toNumber() === 0) {
      res.status(400).json({ error: "Can't checkout with charge of 0" });
      return;
    }

    // Extract and validate reference
    const { reference } = req.query;
    if (!reference) {
      res.status(400).json({ error: "No reference provided" });
      return;
    }

    // Extract and validate account
    const { account } = req.body as MakeTransactionInputData;
    if (!account) {
      res.status(400).json({ error: "No account provided" });
      return;
    }

    const buyerPublicKey = new PublicKey(account);
    const shopPublicKey = shopAddress;

    const network = WalletAdapterNetwork.Devnet;
    const endpoint = clusterApiUrl(network);
    const connection = new Connection(endpoint);

    console.log('Connected to Solana endpoint:', endpoint);

    // Fetch USDC mint details
    let usdcMint;
    try {
      usdcMint = await getMint(connection, usdcAddress);
      console.log('Fetched USDC mint details:', usdcMint);
    } catch (error) {
      console.error('Error fetching USDC mint:', error);
      res.status(500).json({ error: "Error fetching USDC mint details" });
      return;
    }

    // Get associated token addresses for buyer and shop
    let buyerUsdcAddress: PublicKey;
    let shopUsdcAddress: PublicKey;
    try {
      buyerUsdcAddress = await getAssociatedTokenAddress(usdcAddress, buyerPublicKey);
      shopUsdcAddress = await getAssociatedTokenAddress(usdcAddress, shopPublicKey);
      console.log('Buyer USDC address:', buyerUsdcAddress.toString());
      console.log('Shop USDC address:', shopUsdcAddress.toString());
    } catch (error) {
      console.error('Error fetching associated token addresses:', error);
      res.status(500).json({ error: "Error fetching associated token addresses" });
      return;
    }

    // Fetch recent blockhash for transaction
    let blockhash: string;
    try {
      ({ blockhash } = await connection.getLatestBlockhash('finalized'));
      console.log('Fetched recent blockhash:', blockhash);
    } catch (error) {
      console.error('Error fetching recent blockhash:', error);
      res.status(500).json({ error: "Error fetching recent blockhash" });
      return;
    }

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: buyerPublicKey,
    });

    // Create the transfer instruction
    try {
      const transferInstruction = createTransferCheckedInstruction(
        buyerUsdcAddress,
        usdcAddress,
        shopUsdcAddress,
        buyerPublicKey,
        amount.toNumber() * (10 ** usdcMint.decimals),
        usdcMint.decimals,
      );

      transferInstruction.keys.push({
        pubkey: new PublicKey(reference),
        isSigner: false,
        isWritable: false,
      });

      transaction.add(transferInstruction);
    } catch (error) {
      console.error('Error creating transfer instruction:', error);
      res.status(500).json({ error: "Error creating transfer instruction" });
      return;
    }

    // Serialize and return the transaction
    try {
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
      });
      const base64 = serializedTransaction.toString('base64');

      res.status(200).json({
        transaction: base64,
        message: "Thanks for your order! 🛍️",
      });
    } catch (error) {
      console.error('Error serializing transaction:', error);
      res.status(500).json({ error: "Error serializing transaction" });
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error in creating transaction:', err.message);
      res.status(500).json({ error: `Error creating transaction: ${err.message}` });
    } else {
      console.error('Unknown error occurred:', err);
      res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
}

// The API route handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MakeTransactionOutputData | ErrorOutput>
) {
  if (req.method === "GET") {
    return get(res);
  } else if (req.method === "POST") {
    return await post(req, res);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
