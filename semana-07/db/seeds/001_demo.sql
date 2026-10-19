-- Seed = datos; migración = estructura. No vaciar ni duplicar los ejemplos.
INSERT INTO users (email) VALUES ('ana@example.com'), ('luis@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO tasks (title, user_id, done, priority, internal_note)
SELECT sample.title, u.id, sample.done, sample.priority, 'Dato privado del ejemplo'
FROM (VALUES
  ('ana@example.com', 'Diseñar las tablas', TRUE, 'normal'),
  ('ana@example.com', 'Aplicar una migración', FALSE, 'high'),
  ('luis@example.com', 'Conectar el modelo', FALSE, 'normal')
) AS sample(email, title, done, priority)
JOIN users u ON u.email = sample.email
WHERE NOT EXISTS (
  SELECT 1 FROM tasks t WHERE t.user_id = u.id AND t.title = sample.title
);
