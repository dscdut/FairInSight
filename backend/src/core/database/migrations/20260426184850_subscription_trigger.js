exports.up = knex => knex.raw(`
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_active :=
    (NEW.quota > 0)
    AND (NEW.end_date > NOW())
    AND (NEW.deleted_at IS NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_subscription_status
BEFORE INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscription_status();
`);

exports.down = knex => knex.raw(`
DROP TRIGGER IF EXISTS trg_update_subscription_status ON subscriptions;
DROP FUNCTION IF EXISTS update_subscription_status() CASCADE;
`);
