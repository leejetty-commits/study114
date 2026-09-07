USE study114;
UPDATE students SET memo_status = 'open' WHERE id IN (50, 51);
UPDATE students SET memo_status = 'paused' WHERE id = 52;
