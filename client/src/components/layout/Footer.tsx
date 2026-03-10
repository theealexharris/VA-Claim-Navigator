import { Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ContactUsDialog } from "@/components/ContactUsDialog";

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export function Footer() {
  const [location] = useLocation();
  
  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    if (location === "/") {
      scrollToSection(sectionId);
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground py-12 border-t-4 border-secondary">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 font-serif font-bold text-xl mb-4 text-white">
              <Shield className="h-8 w-8 text-secondary fill-secondary/20" />
              <span>VA Claim Navigator<sup className="text-xs align-super">™</sup></span>
            </div>
            <p className="text-primary-foreground/80 max-w-sm leading-relaxed">
              Helping veterans organize their claim information with a guided workflow and
              structured supporting statement drafts — designed for clarity and review before filing.
            </p>
          </div>
          
          <div>
            <h4 className="font-serif font-bold mb-4 text-secondary">Platform</h4>
            <ul className="space-y-2">
              <li><a href="#how-it-works" onClick={(e) => handleSectionClick(e, 'how-it-works')} className="text-primary-foreground/80 hover:text-white transition-colors cursor-pointer">How It Works</a></li>
              <li><a href="#output-preview" onClick={(e) => handleSectionClick(e, 'output-preview')} className="text-primary-foreground/80 hover:text-white transition-colors cursor-pointer">Output Preview</a></li>
              <li><a href="#pricing" onClick={(e) => handleSectionClick(e, 'pricing')} className="text-primary-foreground/80 hover:text-white transition-colors cursor-pointer">Pricing</a></li>
              <li><a href="#faq" onClick={(e) => handleSectionClick(e, 'faq')} className="text-primary-foreground/80 hover:text-white transition-colors cursor-pointer">FAQ</a></li>
              <li><Link href="/login" className="text-primary-foreground/80 hover:text-white transition-colors">Login</Link></li>
              <li><Link href="/signup" className="text-primary-foreground/80 hover:text-white transition-colors">Sign Up</Link></li>
              <li>
                <ContactUsDialog 
                  trigger={
                    <button className="text-primary-foreground/80 hover:text-white transition-colors cursor-pointer text-left">
                      CONTACT US
                    </button>
                  }
                />
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif font-bold mb-4 text-secondary">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy-policy" className="text-primary-foreground/80 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-primary-foreground/80 hover:text-white transition-colors">Terms of Service and Conditions</Link></li>
              <li><Link href="/compliance-notice" className="text-primary-foreground/80 hover:text-white transition-colors">VA Claim Navigator-Software Platform Compliance Notice</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-center items-center">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} VA Claim Navigator™. Not affiliated with the Department of Veterans Affairs.
          </p>
          <p className="text-sm text-primary-foreground/60 mt-1">
            Owned and operated by Pinnacle AI Consulting™
          </p>
        </div>
      </div>
    </footer>
  );
}
