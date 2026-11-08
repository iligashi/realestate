import Header from './Header';
import Footer from './Footer';
import MaintenanceBanner from './MaintenanceBanner';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <MaintenanceBanner />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
