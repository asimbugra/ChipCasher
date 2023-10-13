import { useState } from "react";

interface Props {
  name: string;
  formRef: React.RefObject<HTMLFormElement>;
  onValueChange: (newValue: number) => void;
}

export default function NumberInput({ name, formRef, onValueChange }: Props) {
  const [number, setNumber] = useState(0);

  function handleIncrement() {
    if (number === 0) {
      setNumber(1);
      onValueChange(1);
    }
  }

  function handleDecrement() {
    if (number === 1) {
      setNumber(0);
      onValueChange(0);
    }
  }

  function handleKeyboard(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      handleDecrement();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      handleIncrement();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      formRef.current?.submit();
    }
  }

  return (
    <div className="w-36 border-2 border-gray-200 rounded-md flex flex-row items-center">
      <button
        type="button"
        tabIndex={-1}
        className="basis-1/3 focus:outline-none"
        onClick={handleDecrement}
        onKeyDown={handleKeyboard}
      >
        <span className="m-auto text-2xl font-thin">−</span>
      </button>
      <input
        type="number"
        name={name}
        value={number}
        
        min={0}
        max={1}
        className="w-12 border-none focus:ring-0 text-center bg-gray-200"
      />
      <button
        type="button"
        tabIndex={-1}
        className="basis-1/3 focus:outline-none"
        onClick={handleIncrement}
        onKeyDown={handleKeyboard}
      >
        <span className="m-auto text-2xl font-thin">+</span>
      </button>
    </div>
  );
}
