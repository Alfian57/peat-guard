ALTER TABLE carbon_parameter_sets ADD COLUMN source VARCHAR(300);
ALTER TABLE forest_zones ADD COLUMN review_note VARCHAR(500);
ALTER TABLE forest_zone_carbon_snapshots ADD COLUMN boundary geometry(Polygon, 4326);

CREATE FUNCTION record_snapshot_boundary() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.boundary IS NULL AND NEW.reason <> 'INITIAL_BASELINE' THEN
    SELECT boundary INTO NEW.boundary FROM forest_zones WHERE id = NEW.zone_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER forest_zone_snapshot_boundary
  BEFORE INSERT ON forest_zone_carbon_snapshots
  FOR EACH ROW EXECUTE FUNCTION record_snapshot_boundary();

INSERT INTO forest_zone_carbon_snapshots (
  zone_id, zone_name, village_name, area_hectares, carbon_parameter_set_id,
  parameter_set_name, biomass_factor, emission_factor, co2_conversion_factor,
  incentive_per_ton_idr, is_zone_approved, is_zone_demo_data, is_parameter_demo_data,
  reason, captured_at, boundary
)
SELECT z.id, z.zone_name, z.village_name, z.area_hectares, p.id, p.name,
  p.biomass_factor, p.emission_factor, p.co2_conversion_factor,
  p.incentive_per_ton_idr, z.is_approved, z.is_demo_data, p.is_demo_data,
  'ZONE_UPDATED', statement_timestamp(), z.boundary
FROM forest_zones z JOIN carbon_parameter_sets p ON p.id = z.carbon_parameter_set_id;

CREATE TYPE "CanalCondition" AS ENUM ('BERFUNGSI', 'KERING', 'RUSAK', 'TIDAK_DAPAT_DINILAI');
ALTER TABLE field_reports
  ADD COLUMN canal_condition "CanalCondition",
  ADD COLUMN canal_observation VARCHAR(500),
  ADD COLUMN ai_retry_at TIMESTAMPTZ(6),
  ADD COLUMN ai_failure_reason VARCHAR(80);

CREATE TABLE mrv_documents (
  id UUID PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ(6) NOT NULL,
  published_at TIMESTAMPTZ(6),
  pdf BYTEA,
  CONSTRAINT mrv_document_publication_check CHECK ((published_at IS NULL) = (pdf IS NULL))
);
CREATE INDEX mrv_documents_published_at_idx ON mrv_documents(published_at);

CREATE FUNCTION preserve_published_mrv_document() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.published_at IS NOT NULL THEN
    RAISE EXCEPTION 'Published MRV documents are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER preserve_published_mrv_document
  BEFORE UPDATE OR DELETE ON mrv_documents
  FOR EACH ROW EXECUTE FUNCTION preserve_published_mrv_document();
