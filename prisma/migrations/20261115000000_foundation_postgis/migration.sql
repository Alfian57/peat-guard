-- PostGIS is installed in the migration so shadow databases can replay it.
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('RELAWAN', 'POSKO', 'VERIFIKATOR');

-- CreateEnum
CREATE TYPE "WaterPointType" AS ENUM ('SEKAT_KANAL', 'EMBUNG', 'SUMBER_AIR');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('API_AKTIF', 'ASAP_GAMBUT', 'SEKAT_KANAL_KERING', 'AMAN_TERKENDALI');

-- CreateEnum
CREATE TYPE "ReportUrgency" AS ENUM ('KRITIS', 'WASPADA', 'RENDAH');

-- CreateEnum
CREATE TYPE "HandlingStatus" AS ENUM ('MENUNGGU_TINDAKAN', 'DALAM_PENANGANAN', 'SELESAI');

-- CreateEnum
CREATE TYPE "AIAnalysisState" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'RELAWAN',
    "village_name" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carbon_parameter_sets" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "biomass_factor" DECIMAL(8,2) NOT NULL,
    "emission_factor" DECIMAL(8,4) NOT NULL,
    "co2_conversion_factor" DECIMAL(6,3) NOT NULL DEFAULT 3.67,
    "incentive_per_ton_idr" DECIMAL(14,2) NOT NULL DEFAULT 15000,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_demo_data" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carbon_parameter_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forest_zones" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "zone_name" VARCHAR(150) NOT NULL,
    "village_name" VARCHAR(100),
    "peat_depth_meters" DECIMAL(4,2) NOT NULL DEFAULT 1.5,
    "area_hectares" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "boundary" geometry(Polygon,4326) NOT NULL,
    "carbon_parameter_set_id" UUID NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "is_demo_data" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "forest_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_points" (
    "id" UUID NOT NULL,
    "zone_id" UUID,
    "name" VARCHAR(150) NOT NULL,
    "type" "WaterPointType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geometry(Point,4326) NOT NULL,
    "is_demo_data" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "water_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "satellite_hotspots" (
    "id" UUID NOT NULL,
    "source" VARCHAR(30) NOT NULL,
    "external_id" VARCHAR(120) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geometry(Point,4326) NOT NULL,
    "brightness_kelvin" DECIMAL(6,2),
    "confidence" VARCHAR(20),
    "acquired_at" TIMESTAMPTZ(6) NOT NULL,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_demo_data" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "satellite_hotspots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_reports" (
    "id" UUID NOT NULL,
    "client_report_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "zone_id" UUID,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geometry(Point,4326) NOT NULL,
    "image_path" TEXT NOT NULL,
    "field_notes" TEXT,
    "captured_at" TIMESTAMPTZ(6) NOT NULL,
    "synced_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ai_consent" BOOLEAN NOT NULL DEFAULT false,
    "ai_state" "AIAnalysisState" DEFAULT 'SKIPPED',
    "ai_category" "ReportCategory",
    "ai_urgency" "ReportUrgency",
    "ai_confidence" DECIMAL(4,3),
    "ai_summary" TEXT,
    "ai_visual_indicators" JSONB,
    "ai_false_positive_check" TEXT,
    "ai_action_recommendations" JSONB,
    "ai_analyzed_at" TIMESTAMPTZ(6),
    "handling_status" "HandlingStatus" NOT NULL DEFAULT 'MENUNGGU_TINDAKAN',
    "nearest_water_distance_m" DECIMAL(12,2),
    "is_demo_sample" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "field_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_status_events" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "changed_by_id" UUID NOT NULL,
    "previous_status" "HandlingStatus",
    "next_status" "HandlingStatus" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "report_id" UUID,
    "actor_id" UUID,
    "aggregate_type" VARCHAR(60) NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "event_type" VARCHAR(80) NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "carbon_parameter_sets_name_key" ON "carbon_parameter_sets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "carbon_parameter_sets_one_active_key" ON "carbon_parameter_sets"("is_active") WHERE ("is_active" = true);

-- CreateIndex
CREATE UNIQUE INDEX "forest_zones_slug_key" ON "forest_zones"("slug");

-- CreateIndex
CREATE INDEX "forest_zones_village_name_idx" ON "forest_zones"("village_name");

-- CreateIndex
CREATE INDEX "water_points_zone_id_idx" ON "water_points"("zone_id");

-- CreateIndex
CREATE INDEX "satellite_hotspots_acquired_at_idx" ON "satellite_hotspots"("acquired_at");

-- CreateIndex
CREATE UNIQUE INDEX "satellite_hotspots_source_external_id_key" ON "satellite_hotspots"("source", "external_id");

-- CreateIndex
CREATE INDEX "field_reports_handling_status_created_at_idx" ON "field_reports"("handling_status", "created_at");

-- CreateIndex
CREATE INDEX "field_reports_ai_urgency_created_at_idx" ON "field_reports"("ai_urgency", "created_at");

-- CreateIndex
CREATE INDEX "field_reports_zone_id_created_at_idx" ON "field_reports"("zone_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "field_reports_reporter_id_client_report_id_key" ON "field_reports"("reporter_id", "client_report_id");

-- CreateIndex
CREATE INDEX "report_status_events_report_id_created_at_idx" ON "report_status_events"("report_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_aggregate_type_aggregate_id_created_at_idx" ON "audit_events"("aggregate_type", "aggregate_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_report_id_created_at_idx" ON "audit_events"("report_id", "created_at");

-- AddForeignKey
ALTER TABLE "forest_zones" ADD CONSTRAINT "forest_zones_carbon_parameter_set_id_fkey" FOREIGN KEY ("carbon_parameter_set_id") REFERENCES "carbon_parameter_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_points" ADD CONSTRAINT "water_points_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "forest_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_reports" ADD CONSTRAINT "field_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_reports" ADD CONSTRAINT "field_reports_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "forest_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_status_events" ADD CONSTRAINT "report_status_events_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "field_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_status_events" ADD CONSTRAINT "report_status_events_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "field_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Carbon parameters are estimates and must remain positive/configurable values.
ALTER TABLE "carbon_parameter_sets"
    ADD CONSTRAINT "carbon_parameter_sets_biomass_factor_check" CHECK ("biomass_factor" > 0),
    ADD CONSTRAINT "carbon_parameter_sets_emission_factor_check" CHECK ("emission_factor" > 0),
    ADD CONSTRAINT "carbon_parameter_sets_conversion_factor_check" CHECK ("co2_conversion_factor" > 0),
    ADD CONSTRAINT "carbon_parameter_sets_incentive_nonnegative_check" CHECK ("incentive_per_ton_idr" >= 0);

-- Keep area values derived from the spatial boundary, not from form input.
CREATE FUNCTION set_forest_zone_area_hectares() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.boundary IS NULL OR NOT ST_IsValid(NEW.boundary) THEN
        RAISE EXCEPTION 'Forest zone boundary must be a valid polygon';
    END IF;

    NEW.area_hectares := ROUND((ST_Area(NEW.boundary::geography) / 10000)::numeric, 2);
    RETURN NEW;
END;
$$;

CREATE TRIGGER forest_zones_set_area_hectares
    BEFORE INSERT OR UPDATE OF boundary ON "forest_zones"
    FOR EACH ROW EXECUTE FUNCTION set_forest_zone_area_hectares();

-- Point geometry is derived from coordinates on every insert or coordinate update.
CREATE FUNCTION set_point_location() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.latitude < -90 OR NEW.latitude > 90 OR NEW.longitude < -180 OR NEW.longitude > 180 THEN
        RAISE EXCEPTION 'Point coordinates are outside longitude/latitude bounds';
    END IF;

    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$;

CREATE TRIGGER water_points_set_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON "water_points"
    FOR EACH ROW EXECUTE FUNCTION set_point_location();

CREATE TRIGGER satellite_hotspots_set_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON "satellite_hotspots"
    FOR EACH ROW EXECUTE FUNCTION set_point_location();

CREATE TRIGGER field_reports_set_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON "field_reports"
    FOR EACH ROW EXECUTE FUNCTION set_point_location();

-- Add GiST indexes to geometry columns used by maps and nearest-point queries.
CREATE INDEX "forest_zones_boundary_gist_idx" ON "forest_zones" USING GIST ("boundary");
CREATE INDEX "water_points_location_gist_idx" ON "water_points" USING GIST ("location");
CREATE INDEX "satellite_hotspots_location_gist_idx" ON "satellite_hotspots" USING GIST ("location");
CREATE INDEX "field_reports_location_gist_idx" ON "field_reports" USING GIST ("location");

ALTER TABLE "field_reports"
    ADD CONSTRAINT "field_reports_latitude_bounds_check" CHECK ("latitude" BETWEEN -90 AND 90),
    ADD CONSTRAINT "field_reports_longitude_bounds_check" CHECK ("longitude" BETWEEN -180 AND 180),
    ADD CONSTRAINT "field_reports_ai_confidence_bounds_check" CHECK ("ai_confidence" IS NULL OR "ai_confidence" BETWEEN 0 AND 1),
    ADD CONSTRAINT "field_reports_ai_consent_state_check" CHECK (
        ("ai_consent" AND "ai_state" IS NOT NULL AND "ai_state" IN ('PENDING', 'COMPLETED', 'FAILED')) OR
        (NOT "ai_consent" AND ("ai_state" IS NULL OR "ai_state" = 'SKIPPED'))
    );

ALTER TABLE "water_points"
    ADD CONSTRAINT "water_points_latitude_bounds_check" CHECK ("latitude" BETWEEN -90 AND 90),
    ADD CONSTRAINT "water_points_longitude_bounds_check" CHECK ("longitude" BETWEEN -180 AND 180);

ALTER TABLE "satellite_hotspots"
    ADD CONSTRAINT "satellite_hotspots_latitude_bounds_check" CHECK ("latitude" BETWEEN -90 AND 90),
    ADD CONSTRAINT "satellite_hotspots_longitude_bounds_check" CHECK ("longitude" BETWEEN -180 AND 180);

ALTER TABLE "forest_zones"
    ADD CONSTRAINT "forest_zones_area_nonnegative_check" CHECK ("area_hectares" >= 0),
    ADD CONSTRAINT "forest_zones_boundary_valid_check" CHECK (ST_IsValid("boundary"));

-- Status and audit records are append-only. A status mutation and its event must
-- be inserted in the same application transaction.
CREATE FUNCTION reject_append_only_mutation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION '% is append-only; % is not allowed', TG_TABLE_NAME, TG_OP;
    RETURN NULL;
END;
$$;

CREATE TRIGGER report_status_events_reject_update_delete
    BEFORE UPDATE OR DELETE ON "report_status_events"
    FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();

CREATE TRIGGER report_status_events_reject_truncate
    BEFORE TRUNCATE ON "report_status_events"
    FOR EACH STATEMENT EXECUTE FUNCTION reject_append_only_mutation();

CREATE TRIGGER audit_events_reject_update_delete
    BEFORE UPDATE OR DELETE ON "audit_events"
    FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();

CREATE TRIGGER audit_events_reject_truncate
    BEFORE TRUNCATE ON "audit_events"
    FOR EACH STATEMENT EXECUTE FUNCTION reject_append_only_mutation();
