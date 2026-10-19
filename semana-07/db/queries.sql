-- Ejecutar SELECTs en el Query Tool de pgAdmin sobre aula_web, tras el seed.
-- 1. Una fila es un registro; una columna es un atributo del modelo.
SELECT id, email FROM users ORDER BY id;
SELECT id, title, done, user_id, priority FROM tasks ORDER BY id;

-- 2. JOIN hace visible la relación 1:N sin repetir el email en cada tarea.
SELECT t.id, t.title, t.done, u.email
FROM tasks t JOIN users u ON u.id = t.user_id
WHERE u.email = 'ana@example.com'
ORDER BY t.id;

-- 3. El historial evita repetir CREATE TABLE al ejecutar db:migrate otra vez.
SELECT name, applied_at FROM schema_migrations ORDER BY name;

-- 4. Verificar que la FK y los CHECK son reglas reales de PostgreSQL.
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND table_name = 'tasks';
