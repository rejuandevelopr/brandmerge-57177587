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

      <Footer />
    </div>
  );
};

export default Index;
