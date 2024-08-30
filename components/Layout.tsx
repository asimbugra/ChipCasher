import { PropsWithChildren } from "react";
import Footer from "./Footer";
// Eğer varsa bir Header bileşeni import edin.
// import Header from "./Header";

export default function Layout({ children }: PropsWithChildren<{}>) {
  return (
    <div className='min-h-screen flex flex-col gap-16'>
      {/* <Header /> bileşeni burada kullanılabilir */}
      <main className='mb-auto pt-24'>
        {children}
      </main>
      <Footer />
    </div>
  )
}
