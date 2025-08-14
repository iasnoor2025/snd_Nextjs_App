-- Add Istimara fields to equipment table
ALTER TABLE equipment ADD COLUMN istimara TEXT;
ALTER TABLE equipment ADD COLUMN istimara_expiry_date DATE;

-- Add comments for the new fields
COMMENT ON COLUMN equipment.istimara IS 'Vehicle registration number (Istimara)';
COMMENT ON COLUMN equipment.istimara_expiry_date IS 'Expiry date for the Istimara registration';
