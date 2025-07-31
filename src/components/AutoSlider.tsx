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
          <div key={index} className="w-full flex-shrink-0 px-2 sm:px-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-all duration-300">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <span className="font-bold text-primary text-base sm:text-lg">{testimonial.avatar}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground text-sm sm:text-base">{testimonial.name}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic leading-relaxed text-sm sm:text-base">
                  "{testimonial.text}"
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      
      {/* Indicators */}
      <div className="flex justify-center mt-4 sm:mt-6 space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 touch-manipulation ${
              index === currentIndex ? 'bg-primary w-6 sm:w-8' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default AutoSlider;