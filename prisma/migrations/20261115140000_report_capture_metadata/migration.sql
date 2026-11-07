-- Add optional client capture accuracy and report tags without rewriting rows.
ALTER TABLE "field_reports"
    ADD COLUMN "accuracy_meters" DOUBLE PRECISION,
    ADD COLUMN "tags" VARCHAR(60)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(60)[];

ALTER TABLE "field_reports"
    ADD CONSTRAINT "field_reports_accuracy_meters_check"
        CHECK ("accuracy_meters" IS NULL OR ("accuracy_meters" >= 0 AND "accuracy_meters" <= 100000)),
    ADD CONSTRAINT "field_reports_tags_count_check"
        CHECK (cardinality("tags") <= 12);

-- Record safe field evidence metadata in the existing append-only audit table.
CREATE FUNCTION record_mrv_report_evidence() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    reporter_role TEXT;
BEGIN
    SELECT user_record."role"::text
    INTO reporter_role
    FROM "users" AS user_record
    WHERE user_record."id" = NEW."reporter_id";

    INSERT INTO "audit_events" (
        "id", "report_id", "actor_id", "aggregate_type", "aggregate_id",
        "event_type", "payload", "created_at"
    ) VALUES (
        gen_random_uuid(), NEW."id", NEW."reporter_id", 'FieldReport', NEW."id",
        'REPORT_EVIDENCE_RECORDED',
        jsonb_build_object(
            'source', 'field_sync',
            'actorRole', reporter_role,
            'evidenceSnapshot', jsonb_build_object(
                'latitude', NEW."latitude",
                'longitude', NEW."longitude",
                'accuracyMeters', NEW."accuracy_meters",
                'capturedAt', NEW."captured_at",
                'syncedAt', NEW."synced_at",
                'photoPresent', NEW."image_path" <> '',
                'aiState', NEW."ai_state",
                'aiCategory', NEW."ai_category",
                'aiUrgency', NEW."ai_urgency",
                'aiConfidence', NEW."ai_confidence"
            )
        ),
        clock_timestamp()
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER field_reports_record_mrv_evidence
    AFTER INSERT ON "field_reports"
    FOR EACH ROW EXECUTE FUNCTION record_mrv_report_evidence();

-- Enrich the existing AI completion event instead of adding a duplicate row.
CREATE FUNCTION enrich_mrv_ai_audit_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    classification JSONB;
BEGIN
    IF NEW."event_type" = 'REPORT_AI_ANALYSIS_COMPLETED' AND NEW."report_id" IS NOT NULL THEN
        SELECT jsonb_build_object(
            'state', report."ai_state",
            'category', report."ai_category",
            'urgency', report."ai_urgency",
            'confidence', report."ai_confidence",
            'analyzedAt', report."ai_analyzed_at"
        )
        INTO classification
        FROM "field_reports" AS report
        WHERE report."id" = NEW."report_id";

        IF classification IS NOT NULL THEN
            NEW."payload" := COALESCE(NEW."payload", '{}'::jsonb) ||
                jsonb_build_object('classification', classification);
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER audit_events_capture_mrv_classification
    BEFORE INSERT ON "audit_events"
    FOR EACH ROW EXECUTE FUNCTION enrich_mrv_ai_audit_event();
