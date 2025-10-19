-- Fix notification policies to allow anon role to insert notifications

-- Drop existing policy
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Create new policy that explicitly allows anon role
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Also allow service_role to insert notifications
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Allow anon role to read notification templates
CREATE POLICY "Anyone can read notification templates" ON notification_templates
  FOR SELECT 
  TO anon, authenticated
  USING (active = true);