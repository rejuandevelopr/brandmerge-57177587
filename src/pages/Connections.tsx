import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  UserPlus,
  Send,
  Inbox
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Connection {
  id: string;
  requester_brand_id: string;
  requested_brand_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  intro_message: string;
  created_at: string;
  updated_at: string;
  requester_brand: {
    id: string;
    brand_name: string;
    industry: string;
    mission_statement: string;
  };
  requested_brand: {
    id: string;
    brand_name: string;
    industry: string;
    mission_statement: string;
  };
}

const Connections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [userBrands, setUserBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      // First fetch user's brands
      const { data: brands, error: brandsError } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', user?.id);

      if (brandsError) throw brandsError;
      setUserBrands(brands || []);

      if (!brands || brands.length === 0) {
        setLoading(false);
        return;
      }

      const brandIds = brands.map(b => b.id);

      // Fetch connections involving user's brands
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('brand_connections')
        .select(`
          *,
          requester_brand:brand_profiles!requester_brand_id(id, brand_name, industry, mission_statement),
          requested_brand:brand_profiles!requested_brand_id(id, brand_name, industry, mission_statement)
        `)
        .or(`requester_brand_id.in.(${brandIds.join(',')}),requested_brand_id.in.(${brandIds.join(',')})`)
        .order('created_at', { ascending: false });

      if (connectionsError) throw connectionsError;
      setConnections((connectionsData || []) as Connection[]);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: "Error",
        description: "Failed to load connections. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionResponse = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('brand_connections')
        .update({ status })
        .eq('id', connectionId);

      if (error) throw error;

      // Refresh connections
      await fetchData();

      toast({
        title: status === 'accepted' ? "Connection Accepted!" : "Connection Rejected",
        description: status === 'accepted' 
          ? "You can now start collaborating and messaging." 
          : "The connection request has been declined.",
      });
    } catch (error) {
      console.error('Error updating connection:', error);
      toast({
        title: "Error",
        description: "Failed to update connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getConnectionStats = () => {
    const userBrandIds = userBrands.map(b => b.id);
    
    return {
      active: connections.filter(c => c.status === 'accepted').length,
      pending: connections.filter(c => 
        c.status === 'pending' && userBrandIds.includes(c.requested_brand_id)
      ).length,
      sent: connections.filter(c => 
        c.status === 'pending' && userBrandIds.includes(c.requester_brand_id)
      ).length,
    };
  };

  const filterConnections = (type: string) => {
    const userBrandIds = userBrands.map(b => b.id);
    
    switch (type) {
      case 'active':
        return connections.filter(c => c.status === 'accepted');
      case 'pending':
        return connections.filter(c => 
          c.status === 'pending' && userBrandIds.includes(c.requested_brand_id)
        );
      case 'sent':
        return connections.filter(c => 
          c.status === 'pending' && userBrandIds.includes(c.requester_brand_id)
        );
      default:
        return [];
    }
  };

  const ConnectionCard = ({ connection, showActions = false }: { connection: Connection; showActions?: boolean }) => {
    const userBrandIds = userBrands.map(b => b.id);
    const isRequester = userBrandIds.includes(connection.requester_brand_id);
    const otherBrand = isRequester ? connection.requested_brand : connection.requester_brand;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{otherBrand.brand_name}</CardTitle>
              <CardDescription>{otherBrand.industry}</CardDescription>
            </div>
            <Badge 
              variant={connection.status === 'accepted' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {connection.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {otherBrand.mission_statement}
          </p>
          
          {connection.intro_message && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm italic">"{connection.intro_message}"</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {new Date(connection.created_at).toLocaleDateString()}
            </span>
            
            {showActions && connection.status === 'pending' && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConnectionResponse(connection.id, 'rejected')}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConnectionResponse(connection.id, 'accepted')}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Accept
                </Button>
              </div>
            )}
            
            {connection.status === 'accepted' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate(`/chat/${connection.id}`)}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Message
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading connections...</p>
          </div>
        </div>
      </div>
    );
  }

  if (userBrands.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <UserPlus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Brand Profiles</h2>
            <p className="text-muted-foreground mb-6">
              You need to create a brand profile before you can connect with other brands.
            </p>
            <Button onClick={() => navigate('/brand-builder')}>
              Create Brand Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stats = getConnectionStats();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Brand Connections</h1>
            <p className="text-muted-foreground">
              Manage your brand partnerships and collaboration requests
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-sm text-muted-foreground">Active Connections</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Inbox className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-sm text-muted-foreground">Pending Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Send className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.sent}</p>
                    <p className="text-sm text-muted-foreground">Sent Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Connections Tabs */}
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Active ({stats.active})</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Pending ({stats.pending})</span>
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Sent ({stats.sent})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {filterConnections('active').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Active Connections</h3>
                    <p className="text-muted-foreground mb-4">
                      Start connecting with other brands to build partnerships.
                    </p>
                    <Button onClick={() => navigate('/discovery')}>
                      Discover Brands
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filterConnections('active').map((connection) => (
                    <ConnectionCard key={connection.id} connection={connection} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {filterConnections('pending').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
                    <p className="text-muted-foreground">
                      You have no incoming connection requests at the moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filterConnections('pending').map((connection) => (
                    <ConnectionCard 
                      key={connection.id} 
                      connection={connection} 
                      showActions={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {filterConnections('sent').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Sent Requests</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't sent any connection requests yet.
                    </p>
                    <Button onClick={() => navigate('/discovery')}>
                      Find Brands to Connect
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filterConnections('sent').map((connection) => (
                    <ConnectionCard key={connection.id} connection={connection} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Connections;