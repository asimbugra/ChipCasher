import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';
import Products from '../components/Products';
import SiteHeading from '../components/SiteHeading';

// Dinamik olarak istemci tarafında yükleme
const WalletMultiButtonDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

const DarkModeSwitchDynamic = dynamic(
  () => import('react-toggle-dark-mode').then(mod => mod.DarkModeSwitch),
  { ssr: false }
);

const HomePage = () => {
  const { publicKey } = useWallet();
  const [isDarkMode, setDarkMode] = useState(false);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    // Dark mode state değiştiğinde class ekleme/çıkarma işlemi
    document.body.classList.toggle("dark-mode", checked);
  };

  useEffect(() => {
    // Sayfa yüklendiğinde başlangıçta dark mode durumunu kontrol et ve güncelle
    document.body.classList.toggle("dark-mode", isDarkMode);
  }, []); // Boş bağımlılık dizisiyle sadece bileşen ilk yüklendiğinde çalışır

  return (
    <div className="flex flex-col gap-8 max-w-4xl items-stretch m-auto pt-24">
      {/* <div className="DarkModeSwitch">
        <DarkModeSwitchDynamic
          checked={isDarkMode}
          onChange={toggleDarkMode}
          size={40}
        />
      </div> */}
      <div className="flex justify-between items-center">
        <SiteHeading>ChipCasher</SiteHeading>
      </div>
      <div className="basis-1/4">
        <WalletMultiButtonDynamic className="!bg-gray-900 hover:scale-105" />
      </div>
      <Products submitTarget="/checkout" enabled={publicKey !== null} />
    </div>
  );
};

export default HomePage;
