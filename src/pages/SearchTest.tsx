import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SearchTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [chatgptResults, setChatgptResults] = useState<any[]>([]);
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState("partnerships");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const testChatGPTSearch = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-chatgpt-search', {
        body: {
          searchType,
          industry,
          country,
          city,
          limit: 10
        }
      });

      if (error) throw error;
      
      setChatgptResults(data.results || []);
      toast.success(`ChatGPT found ${data.results?.length || 0} results`);
    } catch (error) {
      console.error('ChatGPT search error:', error);
      toast.error('ChatGPT search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testGoogleSearch = async () => {
    setIsLoading(true);
    try {
      let functionName = '';
      let payload: any = { industry, limit: 10 };

      if (searchType === 'partnerships') {
        functionName = 'fetch-partnership-news';
      } else if (searchType === 'startups') {
        functionName = 'fetch-trending-startups';
        payload = { ...payload, country, city };
      }

      if (functionName) {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload
        });

        if (error) throw error;
        
        setGoogleResults(data.partnerships || data.startups || []);
        toast.success(`Google found ${(data.partnerships || data.startups || []).length} results`);
      }
    } catch (error) {
      console.error('Google search error:', error);
      toast.error('Google search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const runBothSearches = async () => {
    await Promise.all([testChatGPTSearch(), testGoogleSearch()]);
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Search API Comparison</h1>
        <p className="text-muted-foreground">
          Compare ChatGPT Search API vs Google Custom Search API for brand intelligence
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
          <CardDescription>Configure the search to test both APIs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchType">Search Type</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partnerships">Brand Partnerships</SelectItem>
                  <SelectItem value="startups">Trending Startups</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., fashion, tech, wellness"
              />
            </div>

            {searchType === 'startups' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g., United States"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., San Francisco"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={testChatGPTSearch} disabled={isLoading}>
              Test ChatGPT Search
            </Button>
            <Button onClick={testGoogleSearch} disabled={isLoading} variant="outline">
              Test Google Search
            </Button>
            <Button onClick={runBothSearches} disabled={isLoading} variant="secondary">
              Run Both & Compare
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="chatgpt" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chatgpt">
            ChatGPT Results ({chatgptResults.length})
          </TabsTrigger>
          <TabsTrigger value="google">
            Google Results ({googleResults.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chatgpt" className="space-y-4">
          <div className="grid gap-4">
            {chatgptResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {searchType === 'partnerships' 
                        ? `${result.brand_1} × ${result.brand_2}`
                        : result.company_name || result.name
                      }
                    </CardTitle>
                    {result.relevance_score && (
                      <Badge variant="secondary">{result.relevance_score}/100</Badge>
                    )}
                    {result.opportunity_score && (
                      <Badge variant="secondary">{Math.round(result.opportunity_score)}/100</Badge>
                    )}
                    {result.overlapScore && (
                      <Badge variant="secondary">{Math.round(result.overlapScore * 100)}/100</Badge>
                    )}
                  </div>
                  {result.collaboration_type && (
                    <Badge variant="outline">{result.collaboration_type}</Badge>
                  )}
                  {result.industry && (
                    <Badge variant="outline">{result.industry}</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.summary || result.description}
                  </p>
                  {result.source_url && (
                    <a 
                      href={result.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Source: {result.source_url}
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="google" className="space-y-4">
          <div className="grid gap-4">
            {googleResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {searchType === 'partnerships' 
                        ? `${result.brand_1} × ${result.brand_2}`
                        : result.company_name
                      }
                    </CardTitle>
                    {result.relevance_score && (
                      <Badge variant="secondary">{result.relevance_score}/100</Badge>
                    )}
                    {result.opportunity_score && (
                      <Badge variant="secondary">{Math.round(result.opportunity_score)}/100</Badge>
                    )}
                  </div>
                  {result.collaboration_type && (
                    <Badge variant="outline">{result.collaboration_type}</Badge>
                  )}
                  {result.industry && (
                    <Badge variant="outline">{result.industry}</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.summary || result.description}
                  </p>
                  {result.source_url && (
                    <a 
                      href={result.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Source: {result.source_url}
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}