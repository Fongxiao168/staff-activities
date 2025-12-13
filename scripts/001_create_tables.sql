-- Staff Activity Tracker Database Schema
-- This creates tables for staff members and their daily activity records

-- Staff members table (admin creates staff, staff don't need auth)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  department TEXT,
  position TEXT,
  date_of_joining DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Daily activity records table
CREATE TABLE IF NOT EXISTS daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  
  -- Today's metrics (daily values)
  new_clients INTEGER DEFAULT 0,
  today_trust_love INTEGER DEFAULT 0,
  today_hot_chat INTEGER DEFAULT 0,
  today_test_size_cut INTEGER DEFAULT 0,
  today_size_cut INTEGER DEFAULT 0,
  today_new_free_task INTEGER DEFAULT 0,
  today_promote_topup INTEGER DEFAULT 0,
  today_promote_success INTEGER DEFAULT 0,
  today_new_interesting_clients INTEGER DEFAULT 0,
  today_register INTEGER DEFAULT 0,
  first_recharge_amount DECIMAL(12,2) DEFAULT 0,
  today_topup_amount DECIMAL(12,2) DEFAULT 0,
  client_withdraw_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Cumulative/Total metrics (running totals)
  total_trust_love INTEGER DEFAULT 0,
  total_hot_chat INTEGER DEFAULT 0,
  total_free_task INTEGER DEFAULT 0,
  total_interest_topup DECIMAL(12,2) DEFAULT 0,
  total_register_bonus INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- admin who created this record
  
  -- Ensure one record per staff per date
  UNIQUE(staff_id, record_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_records_staff_id ON daily_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(record_date);
CREATE INDEX IF NOT EXISTS idx_daily_records_staff_date ON daily_records(staff_id, record_date);

-- Enable Row Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff table (only authenticated admins can access)
CREATE POLICY "Allow authenticated users to view staff" 
  ON staff FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert staff" 
  ON staff FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update staff" 
  ON staff FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete staff" 
  ON staff FOR DELETE 
  TO authenticated
  USING (true);

-- RLS Policies for daily_records table
CREATE POLICY "Allow authenticated users to view daily_records" 
  ON daily_records FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert daily_records" 
  ON daily_records FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update daily_records" 
  ON daily_records FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete daily_records" 
  ON daily_records FOR DELETE 
  TO authenticated
  USING (true);

-- Function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_records_updated_at ON daily_records;
CREATE TRIGGER update_daily_records_updated_at
  BEFORE UPDATE ON daily_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
