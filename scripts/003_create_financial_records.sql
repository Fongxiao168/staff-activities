-- Create financial_records table for employee monthly financial data
CREATE TABLE IF NOT EXISTS financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  record_month DATE NOT NULL, -- First day of the month (e.g., 2025-01-01 for January 2025)
  monthly_earning NUMERIC(12, 2) DEFAULT 0, -- Employee's monthly earnings
  new_customers_developed INTEGER DEFAULT 0, -- Number of new customers developed that month
  total_customer_investment NUMERIC(14, 2) DEFAULT 0, -- Total investment amount from new customers
  notes TEXT, -- Optional notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(staff_id, record_month) -- One record per staff per month
);

-- Create index for faster queries
CREATE INDEX idx_financial_records_staff_id ON financial_records(staff_id);
CREATE INDEX idx_financial_records_record_month ON financial_records(record_month);

-- Enable RLS
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view financial_records"
  ON financial_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert financial_records"
  ON financial_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update financial_records"
  ON financial_records FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete financial_records"
  ON financial_records FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_financial_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_financial_records_updated_at
  BEFORE UPDATE ON financial_records
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_records_updated_at();
