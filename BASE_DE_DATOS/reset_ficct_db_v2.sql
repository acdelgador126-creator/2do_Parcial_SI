-- Reinicia el esquema public y aplica el DDL v2.
-- USAR SOLO EN DESARROLLO.

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;
