import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AutoSlider from "@/components/AutoSlider";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
      <section className="pt-24 px-6 py-20 text-center relative overflow-hidden bg-white">
        {/* Gradient Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(70.71% 70.71% at 50% 50%, #000 0%, #000 20%, rgba(0, 0, 0, 0.00) 75%)'
            }}
          />
          <div 
            className="absolute top-20 left-1/4 w-96 h-96 rounded-full"
            style={{
              background: 'rgba(74, 196, 84, 0.09)',
              filter: 'blur(50px)'
            }}
          />
          <div 
            className="absolute top-32 right-1/4 w-80 h-80 rounded-full"
            style={{
              background: 'rgba(103, 132, 239, 0.11)',
              filter: 'blur(50px)'
            }}
          />
        </div>
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center mb-8">
            <span className="text-sm text-white/80 tracking-wider uppercase font-body">
              YOUR ALL-IN-ONE AI COLLABORATION PLATFORM
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8 leading-tight text-foreground">
            Find Your Perfect Brand
            <br />
            Collab Partner
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-body">
            We analyze cultural overlaps to connect your brand with ideal partners based on shared audience taste, powered by AI & culture insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 hover:scale-105 transition-all duration-300 font-body font-medium"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 font-body"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-foreground">
              What You Can Do with <span className="text-primary">BrandMerge</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-body">
              From cultural analysis to partnership matching, BrandMerge gives you a full collaboration suite powered by the latest AI — all in one place.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white shadow-lg border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🎯</span>
                </div>
                <CardTitle className="text-xl text-foreground font-heading">Match by Audience Taste</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed font-body">
                  AI-powered matching based on cultural preferences and shared audience interests for perfect brand alignment.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🧠</span>
                </div>
                <CardTitle className="text-xl text-foreground font-heading">Analyze Brand Culture</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed font-body">
                  Deep insights into brand identity, values, and cultural positioning to understand your market presence.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📊</span>
                </div>
                <CardTitle className="text-xl text-foreground font-heading">Visualize Market Overlap</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed font-body">
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
            <h2 className="text-4xl font-heading font-bold mb-6 text-foreground">
              Brands Already Using <span className="text-primary">BrandMerge AI</span>
            </h2>
            <p className="text-xl text-muted-foreground font-body">
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

      <Footer />
    </div>
  );
};

export default Index;
