import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold">B</span>
            </div>
            <span className="text-xl font-heading font-bold text-foreground">BrandMerge</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {!user && (
              <>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-body">
                  Features
                </a>
                <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-body">
                  How to use
                </a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-body">
                  Pricing
                </a>
                <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors font-body">
                  FAQs
                </a>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-muted-foreground hidden md:block font-body">
                  Welcome, {user.email?.split('@')[0]}
                </span>
                {location.pathname === '/' ? (
                  <Button variant="ghost" onClick={() => navigate('/dashboard')} className="font-body">
                    Dashboard
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => navigate('/')} className="font-body">
                    Home
                  </Button>
                )}
                <Button variant="ghost" onClick={handleSignOut} className="font-body">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-body" onClick={handleAuthClick}>
                  Log in
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-body font-medium" onClick={handleAuthClick}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;