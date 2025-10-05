-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 재난 이벤트 테이블
CREATE TABLE disasters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  report_text TEXT NOT NULL,
  address TEXT,
  disaster_type TEXT,
  floor INTEGER,
  trapped_people BOOLEAN DEFAULT false,
  location GEOGRAPHY(POINT, 4326),
  status TEXT DEFAULT 'active', -- active, resolved
  metadata JSONB
);

-- 선발대 기지 테이블
CREATE TABLE response_bases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  available BOOLEAN DEFAULT true
);

-- 선발대 유닛 테이블 (모선, 드론, 로봇)
CREATE TABLE response_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disaster_id UUID REFERENCES disasters(id),
  base_id UUID REFERENCES response_bases(id),
  unit_type TEXT NOT NULL, -- mothership, drone, robot
  status TEXT DEFAULT 'standby', -- standby, deployed, active, returning
  current_location GEOGRAPHY(POINT, 4326),
  route JSONB, -- 이동 경로 저장
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 센서 데이터 테이블
CREATE TABLE sensor_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES response_units(id),
  disaster_id UUID REFERENCES disasters(id),
  data_type TEXT NOT NULL, -- thermal, lidar, gas, smoke
  location GEOGRAPHY(POINT, 4326),
  data JSONB NOT NULL,
  confidence FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 위험 요소 오버레이 테이블
CREATE TABLE hazard_overlays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disaster_id UUID REFERENCES disasters(id),
  hazard_type TEXT NOT NULL, -- fire, collapse, gas_leak, trapped_person
  location GEOGRAPHY(POINT, 4326),
  area GEOGRAPHY(POLYGON, 4326),
  severity TEXT, -- low, medium, high, critical
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- AI 브리핑 테이블
CREATE TABLE ai_briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disaster_id UUID REFERENCES disasters(id),
  briefing_text TEXT NOT NULL,
  briefing_type TEXT DEFAULT 'situation', -- situation, action_plan
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 지리 인덱스 생성
CREATE INDEX idx_disasters_location ON disasters USING GIST(location);
CREATE INDEX idx_response_bases_location ON response_bases USING GIST(location);
CREATE INDEX idx_response_units_location ON response_units USING GIST(current_location);
CREATE INDEX idx_sensor_data_location ON sensor_data USING GIST(location);
CREATE INDEX idx_hazard_overlays_location ON hazard_overlays USING GIST(location);

-- 샘플 선발대 기지 데이터 삽입 (서울 주요 소방서 위치)
INSERT INTO response_bases (name, location) VALUES
  ('서울 중부소방서', ST_SetSRID(ST_MakePoint(126.9784, 37.5665), 4326)),
  ('서울 강남소방서', ST_SetSRID(ST_MakePoint(127.0276, 37.4979), 4326)),
  ('서울 서초소방서', ST_SetSRID(ST_MakePoint(127.0315, 37.4837), 4326)),
  ('서울 송파소방서', ST_SetSRID(ST_MakePoint(127.1056, 37.5145), 4326)),
  ('서울 영등포소방서', ST_SetSRID(ST_MakePoint(126.9095, 37.5262), 4326));

-- Row Level Security (RLS) 활성화
ALTER TABLE disasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazard_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_briefings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 설정 (프로토타입용)
CREATE POLICY "Enable read access for all users" ON disasters FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON response_units FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON sensor_data FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON hazard_overlays FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON ai_briefings FOR SELECT USING (true);

-- 인증된 사용자는 삽입 가능
CREATE POLICY "Enable insert for authenticated users" ON disasters FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users" ON response_units FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users" ON sensor_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users" ON hazard_overlays FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users" ON ai_briefings FOR INSERT WITH CHECK (true);
