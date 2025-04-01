import { Link } from "wouter";
import { Zap, Droplet, MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-white pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-primary-300 mr-1">
                <Zap size={24} />
              </span>
              <span className="text-secondary-300 mr-2">
                <Droplet size={24} />
              </span>
              <span className="font-semibold text-xl text-white">LKR Construction</span>
            </div>
            <p className="text-neutral-300 text-sm">
              Your trusted service provider for all construction, electrical and plumbing needs in Lake Charles, Louisiana.
            </p>
            <div className="flex mt-4 space-x-4">
              <a href="#" className="text-neutral-300 hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-neutral-300 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-neutral-300 hover:text-white">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Services</h3>
            <ul className="text-neutral-300 space-y-2">
              <li><Link href="/request-service" className="hover:text-white">Electrical Services</Link></li>
              <li><Link href="/request-service" className="hover:text-white">Plumbing Services</Link></li>
              <li><Link href="/request-service" className="hover:text-white">Emergency Repairs</Link></li>
              <li><Link href="/request-service" className="hover:text-white">Maintenance</Link></li>
              <li><Link href="/request-service" className="hover:text-white">Installations</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Company</h3>
            <ul className="text-neutral-300 space-y-2">
              <li><Link href="/#about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/#team" className="hover:text-white">Our Team</Link></li>
              <li><Link href="/#careers" className="hover:text-white">Careers</Link></li>
              <li><Link href="/#testimonials" className="hover:text-white">Testimonials</Link></li>
              <li><Link href="/#blog" className="hover:text-white">Blog</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Contact</h3>
            <ul className="text-neutral-300 space-y-2">
              <li className="flex items-start">
                <MapPin className="mt-1 mr-2" size={16} />
                <span>1234 Service Ave,<br />Lake Charles, LA 70601</span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-2" size={16} />
                <span>(337) 123-4567</span>
              </li>
              <li className="flex items-center">
                <Mail className="mr-2" size={16} />
                <span>info@lkrconstruction.com</span>
              </li>
              <li className="flex items-center">
                <Clock className="mr-2" size={16} />
                <span>Mon-Fri: 8AM-6PM</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-neutral-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-400 text-sm">© {new Date().getFullYear()} LKR Construction. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-neutral-400 text-sm hover:text-neutral-300">Privacy Policy</a>
            <a href="#" className="text-neutral-400 text-sm hover:text-neutral-300">Terms of Service</a>
            <a href="#" className="text-neutral-400 text-sm hover:text-neutral-300">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
