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
  location JSON,
  status TEXT,
  metadata JSONB
) AS $$
DECLARE
  v_location GEOGRAPHY;
  v_disaster_id UUID;
BEGIN
  -- 좌표가 제공된 경우 GEOGRAPHY 포인트 생성
  IF p_lng IS NOT NULL AND p_lat IS NOT NULL THEN
    v_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  END IF;

  -- 재난 정보 삽입
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
  RETURNING disasters.id INTO v_disaster_id;

  -- GeoJSON 형식으로 반환
  RETURN QUERY
  SELECT
    d.id,
    d.created_at,
    d.report_text,
    d.address,
    d.disaster_type,
    d.floor,
    d.trapped_people,
    CASE
      WHEN d.location IS NOT NULL THEN
        json_build_object(
          'type', 'Point',
          'coordinates', json_build_array(
            ST_X(d.location::geometry),
            ST_Y(d.location::geometry)
          )
        )
      ELSE NULL
    END AS location,
    d.status,
    d.metadata
  FROM disasters d
  WHERE d.id = v_disaster_id;
END;
$$ LANGUAGE plpgsql;

-- 활성 재난 목록을 location을 GeoJSON 형식으로 반환
CREATE OR REPLACE FUNCTION get_active_disasters()
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  report_text TEXT,
  address TEXT,
  disaster_type TEXT,
  floor INTEGER,
  trapped_people BOOLEAN,
  status TEXT,
  metadata JSONB,
  location JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.created_at,
    d.report_text,
    d.address,
    d.disaster_type,
    d.floor,
    d.trapped_people,
    d.status,
    d.metadata,
    CASE
      WHEN d.location IS NOT NULL THEN
        json_build_object(
          'type', 'Point',
          'coordinates', json_build_array(
            ST_X(d.location::geometry),
            ST_Y(d.location::geometry)
          )
        )
      ELSE NULL
    END AS location
  FROM disasters d
  WHERE d.status = 'active'
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 활성 선발대 유닛 목록을 location을 GeoJSON 형식으로 반환
CREATE OR REPLACE FUNCTION get_active_units()
RETURNS TABLE (
  id UUID,
  disaster_id UUID,
  base_id UUID,
  unit_type TEXT,
  status TEXT,
  route JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  current_location JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.disaster_id,
    u.base_id,
    u.unit_type,
    u.status,
    u.route,
    u.created_at,
    u.updated_at,
    CASE
      WHEN u.current_location IS NOT NULL THEN
        json_build_object(
          'type', 'Point',
          'coordinates', json_build_array(
            ST_X(u.current_location::geometry),
            ST_Y(u.current_location::geometry)
          )
        )
      ELSE NULL
    END AS current_location
  FROM response_units u
  WHERE u.status IN ('deployed', 'active')
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 위험 요소 오버레이 목록을 location을 GeoJSON 형식으로 반환
CREATE OR REPLACE FUNCTION get_hazard_overlays()
RETURNS TABLE (
  id UUID,
  disaster_id UUID,
  hazard_type TEXT,
  severity TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  location JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    h.disaster_id,
    h.hazard_type,
    h.severity,
    h.description,
    h.created_at,
    CASE
      WHEN h.location IS NOT NULL THEN
        json_build_object(
          'type', 'Point',
          'coordinates', json_build_array(
            ST_X(h.location::geometry),
            ST_Y(h.location::geometry)
          )
        )
      ELSE NULL
    END AS location
  FROM hazard_overlays h
  ORDER BY h.created_at DESC;
END;
$$ LANGUAGE plpgsql;
