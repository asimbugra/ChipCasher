import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Products from '../components/Products';
import SiteHeading from '../components/SiteHeading';
import { DarkModeSwitch } from 'react-toggle-dark-mode';

const HomePage = () => {
  const { publicKey } = useWallet();
  const [isDarkMode, setDarkMode] = useState(false);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);

    // Karanlık moda geçiş yaparken sitenizin tasarımını güncelleyebilirsiniz
    document.body.classList.toggle("dark-mode", checked);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl items-stretch m-auto pt-24">
      <div className="DarkModeSwitch">
          <DarkModeSwitch
            checked={isDarkMode}
            onChange={toggleDarkMode}
            size={40}
          />
        </div>
      <div className="flex justify-between items-center">
        
        <SiteHeading >ChipCasher</SiteHeading>
        
      </div>

      <div className="basis-1/4">
        <WalletMultiButton className="!bg-gray-900 hover:scale-105" />
      </div>

      <Products submitTarget="/checkout" enabled={publicKey !== null} />
    </div>
  );
};

export default HomePage;
