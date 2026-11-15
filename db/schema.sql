-- UE Dubai Room Portal — PostgreSQL Schema
-- Works with Supabase, Neon, Railway, or any Postgres 14+

CREATE TABLE rooms (
  id          TEXT PRIMARY KEY,                   -- e.g. "R101", "LAB-A"
  name        TEXT NOT NULL,
  floor       SMALLINT NOT NULL CHECK (floor BETWEEN 1 AND 10),
  type        TEXT NOT NULL,                      -- Lecture Hall, Seminar Room, etc.
  capacity    SMALLINT NOT NULL CHECK (capacity > 0),
  features    TEXT[] DEFAULT '{}',               -- e.g. '{Projector, Whiteboard}'
  maintenance BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE professors (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  department TEXT,
  email      TEXT UNIQUE,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schedule (
  id         SERIAL PRIMARY KEY,
  day        SMALLINT NOT NULL CHECK (day BETWEEN 1 AND 5), -- 1=Mon..5=Fri
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL CHECK (end_time > start_time),
  room_id    TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  course     TEXT NOT NULL,
  code       TEXT NOT NULL,
  professor  TEXT NOT NULL,
  program    TEXT NOT NULL,
  semester   TEXT DEFAULT 'Fall 2026',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_room_overlap EXCLUDE USING gist (
    room_id WITH =,
    day     WITH =,
    tsrange(
      ('2000-01-01'::date + start_time),
      ('2000-01-01'::date + end_time)
    ) WITH &&
  )
);

CREATE TABLE announcements (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','warning','urgent')),
  expires    DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_schedule_day     ON schedule(day);
CREATE INDEX idx_schedule_room    ON schedule(room_id);
CREATE INDEX idx_schedule_time    ON schedule(day, start_time, end_time);
CREATE INDEX idx_ann_expires      ON announcements(expires);

-- Seed rooms
INSERT INTO rooms (id, name, floor, type, capacity, features) VALUES
  ('AUD',    'Auditorium',      1, 'Auditorium',    150, '{"Projector","Mic System","Recording"}'),
  ('R101',   'Room 101',         1, 'Lecture Hall',   80, '{"Projector","Whiteboard","AC"}'),
  ('R102',   'Room 102',         1, 'Lecture Hall',   60, '{"Projector","Whiteboard","AC"}'),
  ('R103',   'Room 103',         1, 'Seminar Room',   35, '{"Smart TV","Whiteboard","AC"}'),
  ('R104',   'Room 104',         1, 'Conference',     20, '{"Smart TV","Video Conf","AC"}'),
  ('R201',   'Room 201',         2, 'Seminar Room',   30, '{"Projector","Whiteboard"}'),
  ('R202',   'Room 202',         2, 'Seminar Room',   30, '{"Projector","Whiteboard"}'),
  ('R203',   'Room 203',         2, 'Seminar Room',   25, '{"Smart TV","Whiteboard"}'),
  ('R204',   'Room 204',         2, 'Tutorial Room',  20, '{"Smart TV","Whiteboard"}'),
  ('R205',   'Room 205',         2, 'Tutorial Room',  15, '{"Smart TV"}'),
  ('LAB-A',  'Computer Lab A',   3, 'Computer Lab',   24, '{"24x PCs","Software Suite","Projector"}'),
  ('LAB-B',  'Computer Lab B',   3, 'Computer Lab',   24, '{"24x PCs","Adobe Suite","Projector"}'),
  ('DESIGN', 'Design Studio',    3, 'Design Studio',  20, '{"iMacs","Drawing Tablets","Large Displays"}');
