-- Prevent duplicate scheduling or completion of the same normalized dose
-- for a child. Review existing duplicates before applying this migration.
CREATE UNIQUE INDEX IF NOT EXISTS uq_vaccinations_child_vaccine_stage
    ON vaccinations (child_id, lower(trim(vaccine_name)));
