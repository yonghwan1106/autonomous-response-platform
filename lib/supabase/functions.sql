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

-- 재난 정보를 삽입하는 함수
CREATE OR REPLACE FUNCTION insert_disaster(
  p_report_text TEXT,
  p_address TEXT,
  p_disaster_type TEXT,
  p_floor INTEGER,
  p_trapped_people BOOLEAN,
  p_lng FLOAT,
  p_lat FLOAT,
  p_metadata JSONB
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  report_text TEXT,
  address TEXT,
  disaster_type TEXT,
  floor INTEGER,
  trapped_people BOOLEAN,
  location GEOGRAPHY,
  status TEXT,
  metadata JSONB
) AS $$
DECLARE
  v_location GEOGRAPHY;
BEGIN
  -- 좌표가 제공된 경우 GEOGRAPHY 포인트 생성
  IF p_lng IS NOT NULL AND p_lat IS NOT NULL THEN
    v_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  END IF;

  -- 재난 정보 삽입 및 반환
  RETURN QUERY
  INSERT INTO disasters (
    report_text,
    address,
    disaster_type,
    floor,
    trapped_people,
    location,
    metadata
  ) VALUES (
    p_report_text,
    p_address,
    p_disaster_type,
    p_floor,
    p_trapped_people,
    v_location,
    p_metadata
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
