import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Brand Director, TechFlow",
    avatar: "S",
    text: "BrandMerge helped us find partners we never would have considered. The cultural analysis was spot-on."
  },
  {
    name: "Marcus Rodriguez", 
    role: "CMO, EcoLux",
    avatar: "M",
    text: "The platform's AI recommendations led to our most successful collaboration yet. Incredible insights."
  },
  {
    name: "Elena Rodriguez",
    role: "Marketing Lead, CreativeHub", 
    avatar: "E",
    text: "Started with the free plan and didn't expect much. But the speed, accuracy, and clean UI convinced me to upgrade in just a few days."
  },
  {
    name: "James Wilson",
    role: "Founder, BrandWave",
    avatar: "J", 
    text: "The cultural overlap analysis is revolutionary. We've doubled our partnership success rate since using BrandMerge."
  }
];

const AutoSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div 
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {testimonials.map((testimonial, index) => (
          <div key={index} className="w-full flex-shrink-0 px-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                    <span className="font-bold text-primary text-lg">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic leading-relaxed">
                  "{testimonial.text}"
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      
      {/* Indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default AutoSlider;