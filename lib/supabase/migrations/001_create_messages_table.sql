-- 메시지 테이블 생성 (관제센터 ↔ 현장 유닛 통신)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'control' or 'unit'
  sender_id TEXT NOT NULL, -- 'control-center' or unit_id
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text' or 'alert'
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX idx_messages_disaster_id ON messages(disaster_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Row Level Security (RLS) 활성화
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 설정 (프로토타입용)
CREATE POLICY "Enable read access for all users" ON messages FOR SELECT USING (true);

-- 인증된 사용자는 삽입 가능
CREATE POLICY "Enable insert for authenticated users" ON messages FOR INSERT WITH CHECK (true);

-- 업데이트 정책 (read 상태 변경용)
CREATE POLICY "Enable update for authenticated users" ON messages FOR UPDATE USING (true);
