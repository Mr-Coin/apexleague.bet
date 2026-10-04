import { Outlet } from "react-router";
import ApexHeader from "@/components/ApexHeader";
import Footer from "@/components/Footer";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <ApexHeader />
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
