-- 가장 가까운 선발대 기지를 찾는 함수
CREATE OR REPLACE FUNCTION find_nearest_base(
  disaster_lat FLOAT,
  disaster_lng FLOAT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  location GEOGRAPHY,
  available BOOLEAN,
  distance FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rb.id,
    rb.name,
    rb.location,
    rb.available,
    ST_Distance(
      rb.location,
      ST_SetSRID(ST_MakePoint(disaster_lng, disaster_lat), 4326)::geography
    ) as distance
  FROM response_bases rb
  WHERE rb.available = true
  ORDER BY distance
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
