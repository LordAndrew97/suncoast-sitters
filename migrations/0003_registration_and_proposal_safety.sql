ALTER TABLE sitter_profiles ADD COLUMN first_name TEXT;
ALTER TABLE sitter_profiles ADD COLUMN last_name TEXT;
ALTER TABLE family_profiles ADD COLUMN first_name TEXT;
ALTER TABLE family_profiles ADD COLUMN last_name TEXT;

CREATE TRIGGER prevent_overlapping_sitter_proposal_insert
BEFORE INSERT ON booking_proposals
WHEN NEW.status IN ('offered','accepted')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1
    FROM bookings target
    JOIN bookings assigned
      ON assigned.assigned_sitter_user_id = NEW.sitter_user_id
     AND assigned.id <> target.id
     AND assigned.status IN ('confirmed','in_progress')
     AND assigned.starts_at < target.ends_at
     AND assigned.ends_at > target.starts_at
    WHERE target.id = NEW.booking_id
    UNION ALL
    SELECT 1
    FROM bookings target
    JOIN booking_proposals proposal
      ON proposal.sitter_user_id = NEW.sitter_user_id
     AND proposal.booking_id <> target.id
     AND proposal.status IN ('offered','accepted')
    JOIN bookings proposed ON proposed.id = proposal.booking_id
     AND proposed.status IN ('offered','confirmed')
     AND proposed.starts_at < target.ends_at
     AND proposed.ends_at > target.starts_at
    WHERE target.id = NEW.booking_id
  ) THEN RAISE(ABORT, 'SITTER_DOUBLE_BOOKING') END;
END;

CREATE TRIGGER prevent_overlapping_sitter_proposal_update
BEFORE UPDATE OF booking_id, sitter_user_id, status ON booking_proposals
WHEN NEW.status IN ('offered','accepted')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1
    FROM bookings target
    JOIN bookings assigned
      ON assigned.assigned_sitter_user_id = NEW.sitter_user_id
     AND assigned.id <> target.id
     AND assigned.status IN ('confirmed','in_progress')
     AND assigned.starts_at < target.ends_at
     AND assigned.ends_at > target.starts_at
    WHERE target.id = NEW.booking_id
    UNION ALL
    SELECT 1
    FROM bookings target
    JOIN booking_proposals proposal
      ON proposal.sitter_user_id = NEW.sitter_user_id
     AND proposal.id <> NEW.id
     AND proposal.booking_id <> target.id
     AND proposal.status IN ('offered','accepted')
    JOIN bookings proposed ON proposed.id = proposal.booking_id
     AND proposed.status IN ('offered','confirmed')
     AND proposed.starts_at < target.ends_at
     AND proposed.ends_at > target.starts_at
    WHERE target.id = NEW.booking_id
  ) THEN RAISE(ABORT, 'SITTER_DOUBLE_BOOKING') END;
END;
