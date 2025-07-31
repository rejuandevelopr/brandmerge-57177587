-- Fix function search path security warnings
-- Update calculate_distance function with secure search path
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC
) RETURNS NUMERIC 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Haversine formula for calculating distance between two lat/lng points
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$;

-- Update calculate_trend_direction function with secure search path
CREATE OR REPLACE FUNCTION public.calculate_trend_direction(
  previous_score NUMERIC, current_score NUMERIC
) RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF previous_score IS NULL THEN
    RETURN 'stable';
  END IF;
  
  IF current_score > previous_score + 5 THEN
    RETURN 'rising';
  ELSIF current_score < previous_score - 5 THEN
    RETURN 'falling';
  ELSE
    RETURN 'stable';
  END IF;
END;
$$;