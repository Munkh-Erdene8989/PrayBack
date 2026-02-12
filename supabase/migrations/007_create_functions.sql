-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  new_number VARCHAR(50);
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate format: ORD-YYYYMMDD-XXXXX
    new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = new_number) INTO exists;
    
    -- If doesn't exist, return it
    IF NOT exists THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update book stock
CREATE OR REPLACE FUNCTION update_book_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease stock when order item is created
  IF TG_OP = 'INSERT' THEN
    UPDATE public.books
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.book_id;
    
    -- Check if stock is sufficient
    IF (SELECT stock_quantity FROM public.books WHERE id = NEW.book_id) < 0 THEN
      RAISE EXCEPTION 'Insufficient stock for book %', NEW.book_id;
    END IF;
  END IF;
  
  -- Increase stock if order item is deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE public.books
    SET stock_quantity = stock_quantity + OLD.quantity
    WHERE id = OLD.book_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock updates
CREATE TRIGGER trigger_update_book_stock
  AFTER INSERT OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_book_stock();

-- Function to calculate order total
CREATE OR REPLACE FUNCTION calculate_order_total(
  p_subtotal DECIMAL,
  p_discount DECIMAL,
  p_delivery_fee DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN p_subtotal - COALESCE(p_discount, 0) + COALESCE(p_delivery_fee, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get tenant by slug
CREATE OR REPLACE FUNCTION get_tenant_by_slug(p_slug VARCHAR)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  admin_username VARCHAR,
  admin_password_hash VARCHAR,
  contact_phone VARCHAR,
  contact_email VARCHAR,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.admin_username,
    t.admin_password_hash,
    t.contact_phone,
    t.contact_email,
    t.is_active
  FROM public.tenants t
  WHERE t.slug = p_slug AND t.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
