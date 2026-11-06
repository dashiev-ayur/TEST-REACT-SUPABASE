SELECT
  email,
  confirmation_token IS NULL AS ct_null,
  email_change IS NULL AS ec_null,
  email_change_token_new IS NULL AS ectn_null,
  recovery_token IS NULL AS rt_null
FROM auth.users