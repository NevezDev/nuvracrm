-- Add interest_level column to leads table
ALTER TABLE leads ADD COLUMN interest_level TEXT DEFAULT 'morno' CHECK (interest_level IN ('muito_frio', 'frio', 'morno', 'quente', 'muito_quente'));

-- Update existing records to have default interest_level
UPDATE leads SET interest_level = 'morno' WHERE interest_level IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE leads ALTER COLUMN interest_level SET NOT NULL;

-- Add comment to the column
COMMENT ON COLUMN leads.interest_level IS 'Nível de interesse do lead: muito_frio, frio, morno, quente, muito_quente';