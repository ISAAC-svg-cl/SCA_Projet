import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen w-full">
    <Navbar />
    <main className="flex-1 min-w-0">{children}</main>
    <Footer />
  </div>
);

export default MainLayout;
