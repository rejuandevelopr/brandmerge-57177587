import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MapPin,
  Globe,
  Building,
  Target,
  Plus,
  Search,
  Filter,
  TrendingUp,
} from 'lucide-react';

interface BrandProfile {
  id: string;
  brand_name: string;
  industry: string;
  mission_statement: string;
  created_at: string;
  country?: string;
  city_region?: string;
  physical_address?: string;
  website_url?: string;
  qloo_analysis_status?: string;
  gpt_synergy_status?: string;
}

interface BrandTableProps {
  brandProfiles: BrandProfile[];
  loading: boolean;
  onRefresh: () => void;
}

export function BrandTable({ brandProfiles, loading, onRefresh }: BrandTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const industries = [...new Set(brandProfiles.map(brand => brand.industry).filter(Boolean))];

  const filteredBrands = brandProfiles.filter(brand => {
    const matchesSearch = brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand.country?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = !selectedIndustry || brand.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  const toggleRow = (brandId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(brandId)) {
      newExpanded.delete(brandId);
    } else {
      newExpanded.add(brandId);
    }
    setExpandedRows(newExpanded);
  };

  const getAnalysisStatus = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'analyzing':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Analyzing</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-muted-foreground/30">Pending</Badge>;
      case 'error':
        return <Badge variant="destructive" className="bg-destructive/20 text-destructive-foreground border-destructive/30">Error</Badge>;
      default:
        return <Badge variant="outline" className="border-muted-foreground/30">Not Started</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">Loading brand profiles...</div>
        </CardContent>
      </Card>
    );
  }

  if (brandProfiles.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No brand profiles yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first brand profile to start connecting with other brands
          </p>
          <Button onClick={() => navigate('/brand-builder')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Brand Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Brand Profiles</h2>
          <p className="text-muted-foreground">
            Manage and analyze your {brandProfiles.length} brand profile{brandProfiles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/brand-builder')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Brand Profile
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search brands, industries, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Brand Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Brand Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Analysis Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrands.map((brand) => (
              <>
                <TableRow key={brand.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(brand.id)}
                          className="p-0 h-8 w-8"
                        >
                          {expandedRows.has(brand.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </Collapsible>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Building className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{brand.brand_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Created {new Date(brand.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{brand.industry || 'Not specified'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {brand.city_region && brand.country ? (
                        <span>{brand.city_region}, {brand.country}</span>
                      ) : brand.country ? (
                        <span>{brand.country}</span>
                      ) : (
                        <span>Not specified</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {getAnalysisStatus(brand.qloo_analysis_status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/brand-profile/${brand.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/discovery')}
                      >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Discover
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Expandable Content */}
                {expandedRows.has(brand.id) && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <Collapsible open={expandedRows.has(brand.id)}>
                        <CollapsibleContent>
                          <div className="bg-muted/30 p-6 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {/* Mission Statement */}
                              <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                  <Target className="w-4 h-4" />
                                  Mission Statement
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {brand.mission_statement || 'No mission statement provided'}
                                </p>
                              </div>

                              {/* Contact Information */}
                              <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                  <Globe className="w-4 h-4" />
                                  Contact Information
                                </h4>
                                <div className="space-y-1 text-sm">
                                  {brand.website_url && (
                                    <div className="flex items-center gap-2">
                                      <ExternalLink className="w-3 h-3" />
                                      <a 
                                        href={brand.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        {brand.website_url}
                                      </a>
                                    </div>
                                  )}
                                  {brand.physical_address && (
                                    <div className="flex items-start gap-2">
                                      <MapPin className="w-3 h-3 mt-0.5" />
                                      <span className="text-muted-foreground">
                                        {brand.physical_address}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Analysis Overview */}
                              <div className="space-y-2">
                                <h4 className="font-medium">Analysis Overview</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Qloo Analysis:</span>
                                    {getAnalysisStatus(brand.qloo_analysis_status)}
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Synergy Analysis:</span>
                                    {getAnalysisStatus(brand.gpt_synergy_status)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredBrands.length === 0 && brandProfiles.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              No brands match your current filters. Try adjusting your search criteria.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}