import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, MessageCircle, MapPin, Users, Target } from 'lucide-react';

interface BrandMatchCardProps {
  brand: {
    id: string;
    brand_name: string;
    industry: string;
    mission_statement: string;
    audience_regions?: string[];
    cultural_taste_markers?: string[];
    collaboration_interests?: string[];
    match_score?: number;
    overlap_percentage?: number;
  };
  onViewProfile: () => void;
  onConnect: () => void;
}

const BrandMatchCard = ({ brand, onViewProfile, onConnect }: BrandMatchCardProps) => {
  const getMatchScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getMatchScoreBadgeVariant = (score: number) => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    return 'outline';
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">{brand.brand_name}</CardTitle>
            <CardDescription className="flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span>{brand.industry}</span>
            </CardDescription>
          </div>
          {brand.match_score && (
            <Badge 
              variant={getMatchScoreBadgeVariant(brand.match_score)}
              className="ml-2"
            >
              {brand.match_score}% match
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mission Statement */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {brand.mission_statement}
        </p>

        {/* Audience Overlap */}
        {brand.overlap_percentage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>Audience Overlap</span>
              </span>
              <span className="font-medium">{brand.overlap_percentage}%</span>
            </div>
            <Progress value={brand.overlap_percentage} className="h-2" />
          </div>
        )}

        {/* Location */}
        {brand.audience_regions && brand.audience_regions.length > 0 && (
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{brand.audience_regions.slice(0, 2).join(', ')}</span>
            {brand.audience_regions.length > 2 && (
              <span>+{brand.audience_regions.length - 2} more</span>
            )}
          </div>
        )}

        {/* Cultural Markers */}
        {brand.cultural_taste_markers && brand.cultural_taste_markers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {brand.cultural_taste_markers.slice(0, 3).map((marker, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {marker}
              </Badge>
            ))}
            {brand.cultural_taste_markers.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{brand.cultural_taste_markers.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Collaboration Interests */}
        {brand.collaboration_interests && brand.collaboration_interests.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Interested in: </span>
            <span className="font-medium">
              {brand.collaboration_interests.slice(0, 2).join(', ')}
              {brand.collaboration_interests.length > 2 && '...'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewProfile}
            className="flex-1 flex items-center space-x-1"
          >
            <Eye className="w-3 h-3" />
            <span>View Profile</span>
          </Button>
          <Button 
            size="sm" 
            onClick={onConnect}
            className="flex-1 flex items-center space-x-1"
          >
            <MessageCircle className="w-3 h-3" />
            <span>Connect</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandMatchCard;