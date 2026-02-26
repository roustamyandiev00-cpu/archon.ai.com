-- Remove all mock/test data from production database
-- This ensures new users start with a clean slate

-- Remove mock offertes
DELETE FROM offertes WHERE nummer IN ('2025-001', '2025-002', '2025-003');

-- Remove mock deals
DELETE FROM deals WHERE titel IN ('Software License', 'Consultancy Project', 'Annual Support');

-- Remove mock projecten
DELETE FROM projecten WHERE naam IN ('Website Redesign', 'Mobile App', 'CRM Integration');

-- Remove mock contacten
DELETE FROM contacten WHERE email IN ('jan@acme.nl', 'maria@acme.nl', 'peter@techstart.nl');

-- Remove mock bedrijven
DELETE FROM bedrijven WHERE naam IN ('ACME BV', 'TechStart NV', 'Global Solutions');

-- Remove any other test data that might exist
DELETE FROM facturen WHERE klant_naam IN ('ACME BV', 'TechStart NV', 'Global Solutions');
DELETE FROM artikelen WHERE naam LIKE '%Test%' OR naam LIKE '%Mock%' OR naam LIKE '%Demo%';
DELETE FROM timesheets WHERE project_naam IN ('Website Redesign', 'Mobile App', 'CRM Integration');

-- Add comment
COMMENT ON TABLE bedrijven IS 'Companies table - cleaned of mock data for production';
COMMENT ON TABLE contacten IS 'Contacts table - cleaned of mock data for production';
COMMENT ON TABLE deals IS 'Deals table - cleaned of mock data for production';
COMMENT ON TABLE projecten IS 'Projects table - cleaned of mock data for production';
COMMENT ON TABLE offertes IS 'Quotes table - cleaned of mock data for production';