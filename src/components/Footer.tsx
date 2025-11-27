import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 mt-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
              JADAYU
            </h3>
            <p className="text-gold-light mb-6 max-w-md leading-relaxed">
              Ensuring fair, transparent, and timely distribution of food grains to every beneficiary through cutting-edge technology and dedicated service.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold-light" />
                <div>
                  <div className="text-sm font-medium">Helpline</div>
                  <div className="text-gold-light">1800-XXX-RATION</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold-light" />
                <div>
                  <div className="text-sm font-medium">Support</div>
                  <div className="text-gold-light">support@jadayu.gov.in</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gold-light" />
                <div>
                  <div className="text-sm font-medium">Location</div>
                  <div className="text-gold-light">Government of India</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/shop" className="text-gold-light hover:text-white transition-colors">
                  📦 Shop Now
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-gold-light hover:text-white transition-colors">
                  📋 Track Orders
                </Link>
              </li>
              <li>
                <Link to="/quota" className="text-gold-light hover:text-white transition-colors">
                  📊 Check Quota
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gold-light hover:text-white transition-colors">
                  👤 My Profile
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-gold-light hover:text-white transition-colors">
                  ❓ Help & FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Services & Support */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Services</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-gold-light">🏪 FPS Registration</span>
              </li>
              <li>
                <span className="text-gold-light">📱 Mobile App</span>
              </li>
              <li>
                <span className="text-gold-light">🚚 Delivery Tracking</span>
              </li>
              <li>
                <span className="text-gold-light">📞 24/7 Support</span>
              </li>
              <li>
                <span className="text-gold-light">🔒 Secure Payments</span>
              </li>
            </ul>

            {/* Operating Hours */}
            <div className="mt-6 pt-6 border-t border-gold-light/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gold-light" />
                <span className="text-sm font-medium">Operating Hours</span>
              </div>
              <p className="text-xs text-gold-light">
                Mon - Sat: 8:00 AM - 8:00 PM<br/>
                Sunday: 10:00 AM - 5:00 PM
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gold-light/20" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Social Media Links */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gold-light">Follow Us:</span>
            <div className="flex gap-3">
              <Facebook className="w-5 h-5 text-gold-light hover:text-white cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-gold-light hover:text-white cursor-pointer transition-colors" />
              <Instagram className="w-5 h-5 text-gold-light hover:text-white cursor-pointer transition-colors" />
              <Youtube className="w-5 h-5 text-gold-light hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Legal Links */}
          <div className="text-sm text-gold-light">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="mx-3">|</span>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span className="mx-3">|</span>
            <Link to="/accessibility" className="hover:text-white transition-colors">Accessibility</Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gold-light/20 text-center">
          <p className="text-sm text-gold-light">
            © 2025 JADAYU - Smart Ration Delivery System. All rights reserved.
            <br/>
            <span className="text-xs opacity-80">A Government of India Initiative</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
