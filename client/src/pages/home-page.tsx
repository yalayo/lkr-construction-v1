import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Droplet, Phone, CheckCircle, Clock, Wrench, Shield, Star } from "lucide-react";

const HomePage = () => {
  return (
    <div className="bg-neutral-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Expert Electrical & Plumbing Services</h1>
              <p className="text-xl mb-8">Reliable professionals serving Lake Charles, Louisiana with quality electrical and plumbing solutions.</p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/request-service">
                  <Button size="lg" className="bg-white text-primary-600 hover:bg-neutral-100">
                    Request Service
                  </Button>
                </Link>
                <Link href="#contact">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    <Phone className="mr-2 h-5 w-5" /> Contact Us
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                  <Zap className="h-10 w-10 mb-4 text-yellow-300" />
                  <h3 className="text-lg font-medium mb-1">Electrical Services</h3>
                  <p className="text-sm text-white/80">Professional solutions for all your electrical needs</p>
                </div>
                <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                  <Droplet className="h-10 w-10 mb-4 text-blue-300" />
                  <h3 className="text-lg font-medium mb-1">Plumbing Services</h3>
                  <p className="text-sm text-white/80">Expert repairs and installations by certified plumbers</p>
                </div>
                <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                  <Clock className="h-10 w-10 mb-4 text-green-300" />
                  <h3 className="text-lg font-medium mb-1">24/7 Emergency</h3>
                  <p className="text-sm text-white/80">Fast response when you need it most</p>
                </div>
                <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                  <Shield className="h-10 w-10 mb-4 text-purple-300" />
                  <h3 className="text-lg font-medium mb-1">Quality Guarantee</h3>
                  <p className="text-sm text-white/80">All work backed by our satisfaction guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white" id="services">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              We provide comprehensive electrical and plumbing services for residential and commercial properties in Lake Charles and surrounding areas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Electrical Services */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-primary-500 p-4 text-white">
                <div className="flex items-center">
                  <Zap className="h-6 w-6 mr-2" />
                  <h3 className="text-xl font-semibold">Electrical Services</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary-500 mr-2" />
                    <span>Circuit breaker repairs & replacements</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary-500 mr-2" />
                    <span>Electrical panel upgrades</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary-500 mr-2" />
                    <span>Outlet & switch installations</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary-500 mr-2" />
                    <span>Lighting fixtures & ceiling fans</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary-500 mr-2" />
                    <span>Electrical troubleshooting</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary-500 mr-2" />
                    <span>Wiring & rewiring services</span>
                  </li>
                </ul>
                <Link href="/request-service?type=electrical">
                  <Button className="w-full mt-6">
                    Request Electrical Service
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Plumbing Services */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-secondary-500 p-4 text-white">
                <div className="flex items-center">
                  <Droplet className="h-6 w-6 mr-2" />
                  <h3 className="text-xl font-semibold">Plumbing Services</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-secondary-500 mr-2" />
                    <span>Drain cleaning & unclogging</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-secondary-500 mr-2" />
                    <span>Faucet & fixture repairs</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-secondary-500 mr-2" />
                    <span>Toilet repairs & installations</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-secondary-500 mr-2" />
                    <span>Water heater services</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-secondary-500 mr-2" />
                    <span>Pipe repair & replacement</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-secondary-500 mr-2" />
                    <span>Leak detection & repair</span>
                  </li>
                </ul>
                <Link href="/request-service?type=plumbing">
                  <Button className="w-full mt-6 bg-secondary-500 hover:bg-secondary-600">
                    Request Plumbing Service
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Link href="/request-service?type=both">
              <Button size="lg" className="bg-gradient-to-r from-primary-500 to-secondary-500">
                Request Both Services
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Why Choose Us Section */}
      <section className="py-16 bg-neutral-50" id="about">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose ElecPlumb</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              With years of experience serving Lake Charles, we've built our reputation on quality workmanship and exceptional customer service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <div className="mx-auto bg-primary-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                <Wrench className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Licensed Professionals</h3>
              <p className="text-neutral-600">
                Our team consists of licensed, insured, and highly trained technicians with years of experience.
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="mx-auto bg-primary-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Prompt Service</h3>
              <p className="text-neutral-600">
                We understand that your time is valuable, which is why we always arrive on schedule.
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="mx-auto bg-primary-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
              <p className="text-neutral-600">
                We stand behind our work with a 100% satisfaction guarantee on all services provided.
              </p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600 text-white" id="contact">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Contact us today to schedule a service appointment or request a free consultation for your electrical or plumbing needs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/request-service">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-neutral-100">
                Request Service
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Phone className="mr-2 h-5 w-5" /> (337) 123-4567
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
