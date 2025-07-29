const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">B</span>
              </div>
              <span className="text-xl font-bold text-foreground">BrandMerge</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              AI-powered brand collaboration platform connecting businesses through cultural insights.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">PRODUCT</h4>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">
                Features
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">
                Benefits
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">
                How to use
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">
                Pricing
              </a>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">LEGALS</h4>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">
                Terms & Conditions
              </a>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">SOCIAL</h4>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">
                Twitter (X)
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">
                LinkedIn
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            © 2025 BRANDMERGE. ALL RIGHTS RESERVED.
          </p>
          <button className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            BACK TO TOP
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;