-- V050: Repair legacy ordinal-enum drift on livestreams.status.
-- Legacy databases (baselined before V033 ran) hold status as SMALLINT with a
-- 0..2 check constraint from the old Hibernate enum-ordinal era. The entity now
-- maps StreamStatus as @Enumerated(EnumType.STRING) (VARCHAR), so schema
-- validation fails with: found [int2], expecting [varchar(255)].
-- Conversion is guarded so this is a no-op on fresh databases where V033
-- already created status as VARCHAR(50). Ordinals 0/1/2 map to the enum
-- declaration order: SCHEDULED, LIVE, ENDED.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'livestreams'
      AND column_name = 'status'
      AND data_type = 'smallint'
  ) THEN
    ALTER TABLE livestreams DROP CONSTRAINT IF EXISTS livestreams_status_check;
    ALTER TABLE livestreams ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE livestreams ALTER COLUMN status TYPE VARCHAR(50)
      USING CASE status
              WHEN 0 THEN 'SCHEDULED'::varchar(50)
              WHEN 1 THEN 'LIVE'::varchar(50)
              WHEN 2 THEN 'ENDED'::varchar(50)
              ELSE NULL
            END;
  END IF;
END $$;
