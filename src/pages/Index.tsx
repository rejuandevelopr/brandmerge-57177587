import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AutoSlider from "@/components/AutoSlider";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, ArrowRight, Upload, Brain, Users, MessageSquare } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 px-6 py-20 text-center relative overflow-hidden">
        {/* Background orbital elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center mb-8">
            <span className="text-sm text-muted-foreground tracking-wider uppercase">
              YOUR ALL-IN-ONE AI COLLABORATION PLATFORM
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Find Your Perfect Brand
            </span>
            <br />
            <span className="text-foreground">Collab Partner</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            We analyze cultural overlaps to connect your brand with ideal partners based on shared audience taste, powered by AI & culture insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 transition-all duration-300"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-border hover:bg-card text-foreground">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-card/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              What You Can Do with <span className="text-primary">BrandMerge</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From cultural analysis to partnership matching, BrandMerge gives you a full collaboration suite powered by the latest AI — all in one place.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-all duration-300 hover:-translate-y-2 group">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🎯</span>
                </div>
                <CardTitle className="text-xl text-foreground">Match by Audience Taste</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  AI-powered matching based on cultural preferences and shared audience interests for perfect brand alignment.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-all duration-300 hover:-translate-y-2 group">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🧠</span>
                </div>
                <CardTitle className="text-xl text-foreground">Analyze Brand Culture</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Deep insights into brand identity, values, and cultural positioning to understand your market presence.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-all duration-300 hover:-translate-y-2 group">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📊</span>
                </div>
                <CardTitle className="text-xl text-foreground">Visualize Market Overlap</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Interactive visualizations showing audience intersections and collaboration potential for strategic decisions.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Brands Already Using <span className="text-primary">BrandMerge AI</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              See what industry leaders are saying about our platform
            </p>
          </div>
          
          <AutoSlider />
          
          <div className="mt-16 flex flex-wrap justify-center items-center gap-12 opacity-60">
            <div className="text-2xl font-bold text-muted-foreground hover:text-primary transition-colors">TechFlow</div>
            <div className="text-2xl font-bold text-muted-foreground hover:text-primary transition-colors">EcoLux</div>
            <div className="text-2xl font-bold text-muted-foreground hover:text-primary transition-colors">CreativeHub</div>
            <div className="text-2xl font-bold text-muted-foreground hover:text-primary transition-colors">BrandWave</div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section id="how-it-works" className="px-6 py-20 bg-card/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              How to Use <span className="text-primary">BrandMerge</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get started with brand collaboration in just a few simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-all duration-300 group text-center">
              <CardHeader className="pb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg text-foreground">1. Upload Brand Info</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Share your brand details, values, and target audience to build your profile.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-all duration-300 group text-center">
              <CardHeader className="pb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg text-foreground">2. AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Our AI analyzes your brand culture and identifies potential collaboration partners.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-all duration-300 group text-center">
              <CardHeader className="pb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg text-foreground">3. View Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Browse curated matches with detailed synergy scores and cultural overlap insights.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-all duration-300 group text-center">
              <CardHeader className="pb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg text-foreground">4. Connect & Collaborate</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Start conversations and build meaningful partnerships with aligned brands.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Simple, Transparent <span className="text-primary">Pricing</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that fits your brand's collaboration needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-6">
                <Badge variant="secondary" className="mb-4 w-fit mx-auto">Starter</Badge>
                <CardTitle className="text-2xl text-foreground mb-4">Free</CardTitle>
                <div className="text-4xl font-bold text-foreground">$0</div>
                <CardDescription className="text-muted-foreground">per month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Up to 5 brand matches</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Basic cultural analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Email support</span>
                </div>
                <Button variant="outline" className="w-full mt-6" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:bg-card/70 transition-all duration-300 hover:-translate-y-2 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-6">
                <Badge variant="secondary" className="mb-4 w-fit mx-auto">Professional</Badge>
                <CardTitle className="text-2xl text-foreground mb-4">Pro</CardTitle>
                <div className="text-4xl font-bold text-foreground">$49</div>
                <CardDescription className="text-muted-foreground">per month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Unlimited brand matches</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Advanced AI analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Direct messaging</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Priority support</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Market intelligence reports</span>
                </div>
                <Button className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleGetStarted}>
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-6">
                <Badge variant="secondary" className="mb-4 w-fit mx-auto">Enterprise</Badge>
                <CardTitle className="text-2xl text-foreground mb-4">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-foreground">Custom</div>
                <CardDescription className="text-muted-foreground">pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Everything in Pro</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Custom integrations</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Dedicated account manager</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">White-label options</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">SLA guarantee</span>
                </div>
                <Button variant="outline" className="w-full mt-6">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faq" className="px-6 py-20 bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about BrandMerge
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                How does BrandMerge's AI matching work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our AI analyzes cultural overlaps, audience preferences, brand values, and market positioning to identify brands with high collaboration potential. We use advanced machine learning algorithms trained on successful partnerships to provide accurate matching scores.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                Is my brand data secure and private?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, we take data security seriously. All brand information is encrypted in transit and at rest. We never share your data with third parties without explicit consent, and you maintain full control over what information is visible to potential partners.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                Can I try BrandMerge before committing to a paid plan?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely! We offer a free plan with up to 5 brand matches and basic features. Pro plan users get a 14-day free trial with full access to all features. No credit card required to start.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                What types of brands work best with BrandMerge?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                BrandMerge works for all types of brands - from startups to Fortune 500 companies, across industries including fashion, tech, food & beverage, lifestyle, and more. Our AI adapts to different brand categories and collaboration styles.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                How do I get started with my first collaboration?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Simply create your brand profile, let our AI analyze your brand culture, browse your matches, and send connection requests to brands you're interested in collaborating with. Our platform facilitates the entire process from discovery to communication.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                Do you offer onboarding support?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Pro and Enterprise customers receive dedicated onboarding support. Free plan users have access to our comprehensive help center and email support. We also offer optional brand consultation sessions to optimize your profile.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
