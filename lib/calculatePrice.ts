import BigNumber from "bignumber.js";
import { ParsedUrlQuery } from "querystring";
import { products } from "./products";

export default function calculatePrice(query: ParsedUrlQuery): BigNumber {
  let amount = new BigNumber(0);
  
  for (let [id, quantity] of Object.entries(query)) {
    if (!quantity || isNaN(Number(quantity))) {
      console.warn(`Invalid quantity for product ID: ${id}`);
      continue; // Skip invalid quantities
    }

    const product = products.find(p => p.id === id);
    if (!product) {
      console.warn(`Product not found for ID: ${id}`);
      continue; // Skip if product is not found
    }

    const price = new BigNumber(product.priceSol); // Ensure price is a BigNumber
    const productQuantity = new BigNumber(quantity as string);
    amount = amount.plus(productQuantity.multipliedBy(price));
  }

  console.log(`Total amount: ${amount.toString()}`); // More informative logging
  return amount;
}
