import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap, Droplet, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-primary mr-1">
                <Zap size={24} />
              </span>
              <span className="text-secondary-500 mr-2">
                <Droplet size={24} />
              </span>
              <span className="font-semibold text-xl text-neutral-800">ElecPlumb</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-primary text-sm font-medium text-neutral-700">
                Home
              </Link>
              <Link href="/request-service" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-neutral-500 hover:text-neutral-700 hover:border-neutral-300">
                Services
              </Link>
              <Link href="/#about" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-neutral-500 hover:text-neutral-700 hover:border-neutral-300">
                About
              </Link>
              <Link href="/#contact" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-neutral-500 hover:text-neutral-700 hover:border-neutral-300">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            <Link href="/auth">
              <Button variant="outline" className="mr-2">Log in</Button>
            </Link>
            <Link href="/request-service">
              <Button>Get Started</Button>
            </Link>
            
            <div className="ml-4 md:hidden">
              <Button
                variant="ghost"
                onClick={toggleMobileMenu}
                className="p-2"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link href="/">
                <span className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-50">
                  Home
                </span>
              </Link>
              <Link href="/request-service">
                <span className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-50">
                  Services
                </span>
              </Link>
              <Link href="/#about">
                <span className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-50">
                  About
                </span>
              </Link>
              <Link href="/#contact">
                <span className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-50">
                  Contact
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
