import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleAuthClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BrandLogo className="text-primary-foreground" size={20} />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground">BrandMerge</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            {!user && (
              <>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  How to use
                </a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
                <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQs
                </a>
              </>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
            {user ? (
              <>
                <span className="text-muted-foreground hidden lg:block text-sm">
                  Welcome, {user.email?.split('@')[0]}
                </span>
                {location.pathname === '/' ? (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                    Home
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={handleAuthClick}>
                  Log in
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleAuthClick}>
                  Get started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-4 pb-4 border-t border-border">
            <div className="flex flex-col space-y-4 pt-4">
              {!user && (
                <>
                  <a 
                    href="#features" 
                    className="text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a 
                    href="#how-it-works" 
                    className="text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How to use
                  </a>
                  <a 
                    href="#pricing" 
                    className="text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </a>
                  <a 
                    href="#faq" 
                    className="text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    FAQs
                  </a>
                </>
              )}
              
              {user ? (
                <div className="flex flex-col space-y-3 pt-2">
                  <div className="text-sm text-muted-foreground">
                    Welcome, {user.email?.split('@')[0]}
                  </div>
                  {location.pathname === '/' ? (
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        navigate('/dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className="justify-start"
                    >
                      Dashboard
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        navigate('/');
                        setMobileMenuOpen(false);
                      }}
                      className="justify-start"
                    >
                      Home
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    onClick={handleSignOut}
                    className="justify-start"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3 pt-2">
                  <Button 
                    variant="ghost" 
                    onClick={handleAuthClick}
                    className="justify-start text-muted-foreground hover:text-foreground"
                  >
                    Log in
                  </Button>
                  <Button 
                    onClick={handleAuthClick}
                    className="justify-start bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Get started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;