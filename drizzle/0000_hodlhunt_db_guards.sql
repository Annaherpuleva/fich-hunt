-- HODLHunt DB hardening: constraints, ledger invariants and optimistic locking.

BEGIN;

-- 1) Ocean state is derived from ledger-domain logic only: block direct balance mutation.
CREATE OR REPLACE FUNCTION hh_ocean_state_guard_balance_units()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.balance_units IS DISTINCT FROM OLD.balance_units THEN
    RAISE EXCEPTION 'Direct update of hh_ocean_state.balance_units is forbidden; use ledger/domain flow';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hh_ocean_state_guard_balance_units_trg ON hh_ocean_state;
CREATE TRIGGER hh_ocean_state_guard_balance_units_trg
BEFORE UPDATE ON hh_ocean_state
FOR EACH ROW
EXECUTE FUNCTION hh_ocean_state_guard_balance_units();

-- 2) Fish optimistic locking must always increment version exactly by +1 on update.
CREATE OR REPLACE FUNCTION hh_fish_guard_version_increment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.version <> OLD.version + 1 THEN
    RAISE EXCEPTION 'Invalid hh_fish.version transition: expected %, got %', OLD.version + 1, NEW.version;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hh_fish_guard_version_increment_trg ON hh_fish;
CREATE TRIGGER hh_fish_guard_version_increment_trg
BEFORE UPDATE ON hh_fish
FOR EACH ROW
EXECUTE FUNCTION hh_fish_guard_version_increment();

-- 3) Ledger invariant: any entry linked to payment must match payment owner and direction.
CREATE OR REPLACE FUNCTION hh_ledger_entries_validate_payment_link()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  p_user_id integer;
  p_direction payment_direction;
BEGIN
  IF NEW.payment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id, direction
    INTO p_user_id, p_direction
  FROM hh_payments
  WHERE id = NEW.payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Linked payment % not found for ledger entry', NEW.payment_id;
  END IF;

  IF p_user_id <> NEW.user_id THEN
    RAISE EXCEPTION 'Ledger entry user_id % must match payment user_id % for payment %', NEW.user_id, p_user_id, NEW.payment_id;
  END IF;

  IF p_direction = 'deposit' AND NEW.delta <= 0 THEN
    RAISE EXCEPTION 'Deposit-linked ledger delta must be > 0 for payment %', NEW.payment_id;
  END IF;

  IF p_direction = 'withdraw' AND NEW.delta >= 0 THEN
    RAISE EXCEPTION 'Withdraw-linked ledger delta must be < 0 for payment %', NEW.payment_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hh_ledger_entries_validate_payment_link_trg ON hh_ledger_entries;
CREATE TRIGGER hh_ledger_entries_validate_payment_link_trg
BEFORE INSERT OR UPDATE ON hh_ledger_entries
FOR EACH ROW
EXECUTE FUNCTION hh_ledger_entries_validate_payment_link();

COMMIT;
