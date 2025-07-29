import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="px-6 py-20 text-center">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Find Your Perfect Brand Collab Partner, Powered by AI & Culture
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            We analyze cultural overlaps to connect your brand with ideal partners based on shared audience taste.
          </p>
          <Button size="lg" className="text-lg px-8 py-6 hover:scale-105 transition-transform">
            Join Beta
          </Button>
        </div>
      </section>

      {/* Preview Features */}
      <section className="px-6 py-16 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Highlights</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <CardTitle>Match by Audience Taste</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI-powered matching based on cultural preferences and shared audience interests
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🧠</span>
                </div>
                <CardTitle>Analyze Brand Culture</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Deep insights into brand identity, values, and cultural positioning
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle>Visualize Market Overlap</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Interactive visualizations showing audience intersections and collaboration potential
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials/Logos */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-8">Brands Already Using BrandMerge AI</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-6">
              <CardContent className="pt-0">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                    <span className="font-bold text-primary">B</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Sarah Chen</h4>
                    <p className="text-sm text-muted-foreground">Brand Director, TechFlow</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "BrandMerge helped us find partners we never would have considered. The cultural analysis was spot-on."
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="pt-0">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                    <span className="font-bold text-primary">M</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Marcus Rodriguez</h4>
                    <p className="text-sm text-muted-foreground">CMO, EcoLux</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "The platform's AI recommendations led to our most successful collaboration yet. Incredible insights."
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-muted-foreground">TechFlow</div>
            <div className="text-2xl font-bold text-muted-foreground">EcoLux</div>
            <div className="text-2xl font-bold text-muted-foreground">CreativeHub</div>
            <div className="text-2xl font-bold text-muted-foreground">BrandWave</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
