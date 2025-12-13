-- Migration: Add date_of_joining column to staff table
ALTER TABLE staff
ADD COLUMN date_of_joining DATE;
