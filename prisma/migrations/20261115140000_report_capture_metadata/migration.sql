-- Add optional client capture accuracy and report tags without rewriting rows.
ALTER TABLE "field_reports"
    ADD COLUMN "accuracy_meters" DOUBLE PRECISION,
    ADD COLUMN "tags" VARCHAR(60)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(60)[];

ALTER TABLE "field_reports"
    ADD CONSTRAINT "field_reports_accuracy_meters_check"
        CHECK ("accuracy_meters" IS NULL OR ("accuracy_meters" >= 0 AND "accuracy_meters" <= 100000)),
    ADD CONSTRAINT "field_reports_tags_count_check"
        CHECK (cardinality("tags") <= 12);
