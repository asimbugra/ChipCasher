import { useRef } from "react";
import { products } from "../lib/products";
import NumberInput from "./NumberInput";

interface Props {
  submitTarget: string;
  enabled: boolean;
}

export default function Products({ submitTarget, enabled }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleResetValues = () => {
    // Diğer değerleri sıfırla
    console.log("Diğer değerleri sıfırla"); // Sadece test için
  };

  return (
    <form method='get' action={submitTarget} ref={formRef}>
      <div className='flex flex-col items-center gap-16'>
        {/* Responsive grid yapısı */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-items-center w-full max-w-screen-lg mx-auto">
          {products.map((product, index) => {
            return (
              <div className="w-full sm:w-auto rounded-md bg-white text-left p-6 shadow-md hover:shadow-lg transition-shadow" key={product.id}>
                <h3 className="text-2xl font-bold">{product.name}</h3>
                <p className="text-sm text-gray-800">{product.description}</p>
                <p className="my-4">
                  <span className="mt-4 text-xl font-bold">${product.priceUsd}</span>
                  {product.unitName && (
                    <span className="text-sm text-gray-800"> /{product.unitName}</span>
                  )}
                </p>
                <div className="mt-1">
                  <NumberInput
                    name={product.id}
                    formRef={formRef}
                    onValueChange={(newValue) => {
                      handleResetValues(); // Diğer değerleri sıfırla
                      console.log(`Ürün ${index} değeri: ${newValue}`); // Sadece test için
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsive buton */}
        <button
          className="items-center px-20 py-2 rounded-md max-w-fit self-center bg-gray-900 text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!enabled}
        >
          Buy
        </button>
      </div>
    </form>
  );
}
