import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useBrandDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteBrandProfile = async (brandId: string): Promise<boolean> => {
    setIsDeleting(true);
    
    try {
      // Delete related data first to prevent foreign key violations
      const deletions = await Promise.allSettled([
        supabase.from('brand_analysis_sessions').delete().eq('brand_profile_id', brandId),
        supabase.from('brand_match_analyses').delete().eq('brand_profile_id', brandId),
        supabase.from('brand_qloo_analyses').delete().eq('brand_profile_id', brandId),
        supabase.from('brand_synergy_analyses').delete().eq('brand_profile_id', brandId),
        supabase.from('brand_connections').delete().or(`requester_brand_id.eq.${brandId},requested_brand_id.eq.${brandId}`)
      ]);

      // Check if any critical deletions failed
      const failedDeletions = deletions.filter(result => result.status === 'rejected');
      if (failedDeletions.length > 0) {
        console.warn('Some related data deletions failed:', failedDeletions);
      }

      // Delete the brand profile itself
      const { error } = await supabase
        .from('brand_profiles')
        .delete()
        .eq('id', brandId);

      if (error) {
        throw error;
      }

      toast({
        title: "Brand Profile Deleted",
        description: "Your brand profile and all related data have been successfully deleted.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting brand profile:', error);
      toast({
        title: "Error",
        description: "Failed to delete brand profile. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteBrandProfile, isDeleting };
};