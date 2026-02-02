import React from 'react';
import { Toaster } from 'sonner';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/home/Hero';
import { Inventory } from './components/inventory/Inventory';
import { Contact } from './components/home/Contact';

function App() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-900 selection:text-white">
      <Header />
      <Hero />
      <Inventory />
      <Contact />
      <Footer />
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}

export default App;
