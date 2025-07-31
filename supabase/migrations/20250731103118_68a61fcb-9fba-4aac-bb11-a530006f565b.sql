-- Add location columns to brand_profiles
ALTER TABLE brand_profiles ADD COLUMN country TEXT;
ALTER TABLE brand_profiles ADD COLUMN city_region TEXT;  
ALTER TABLE brand_profiles ADD COLUMN physical_address TEXT;
ALTER TABLE brand_profiles ADD COLUMN website_url TEXT;

-- Add location columns to trending_startups
ALTER TABLE trending_startups ADD COLUMN country TEXT;
ALTER TABLE trending_startups ADD COLUMN city TEXT;
ALTER TABLE trending_startups ADD COLUMN headquarters_location TEXT;

-- Create geographic indexes for performance
CREATE INDEX idx_brand_profiles_country ON brand_profiles(country);
CREATE INDEX idx_brand_profiles_city ON brand_profiles(city_region);
CREATE INDEX idx_trending_startups_location ON trending_startups(country, city);