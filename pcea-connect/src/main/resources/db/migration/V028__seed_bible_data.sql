-- Insert all 66 books (KJV order)
INSERT INTO bible_books (id, name, testament, order_index) VALUES
('book-gen', 'Genesis', 'OLD', 1), ('book-exo', 'Exodus', 'OLD', 2),
('book-lev', 'Leviticus', 'OLD', 3), ('book-num', 'Numbers', 'OLD', 4),
('book-deu', 'Deuteronomy', 'OLD', 5), ('book-jos', 'Joshua', 'OLD', 6),
('book-jud', 'Judges', 'OLD', 7), ('book-rut', 'Ruth', 'OLD', 8),
('book-1sa', '1 Samuel', 'OLD', 9), ('book-2sa', '2 Samuel', 'OLD', 10),
('book-1ki', '1 Kings', 'OLD', 11), ('book-2ki', '2 Kings', 'OLD', 12),
('book-1ch', '1 Chronicles', 'OLD', 13), ('book-2ch', '2 Chronicles', 'OLD', 14),
('book-ezr', 'Ezra', 'OLD', 15), ('book-neh', 'Nehemiah', 'OLD', 16),
('book-est', 'Esther', 'OLD', 17), ('book-job', 'Job', 'OLD', 18),
('book-psa', 'Psalms', 'OLD', 19), ('book-pro', 'Proverbs', 'OLD', 20),
('book-ecc', 'Ecclesiastes', 'OLD', 21), ('book-sos', 'Song of Solomon', 'OLD', 22),
('book-isa', 'Isaiah', 'OLD', 23), ('book-jer', 'Jeremiah', 'OLD', 24),
('book-lam', 'Lamentations', 'OLD', 25), ('book-eze', 'Ezekiel', 'OLD', 26),
('book-dan', 'Daniel', 'OLD', 27), ('book-hos', 'Hosea', 'OLD', 28),
('book-joe', 'Joel', 'OLD', 29), ('book-amo', 'Amos', 'OLD', 30),
('book-oba', 'Obadiah', 'OLD', 31), ('book-jon', 'Jonah', 'OLD', 32),
('book-mic', 'Micah', 'OLD', 33), ('book-nah', 'Nahum', 'OLD', 34),
('book-hab', 'Habakkuk', 'OLD', 35), ('book-zep', 'Zephaniah', 'OLD', 36),
('book-hag', 'Haggai', 'OLD', 37), ('book-zec', 'Zechariah', 'OLD', 38),
('book-mal', 'Malachi', 'OLD', 39),
('book-mat', 'Matthew', 'NEW', 40), ('book-mar', 'Mark', 'NEW', 41),
('book-luk', 'Luke', 'NEW', 42), ('book-joh', 'John', 'NEW', 43),
('book-act', 'Acts', 'NEW', 44), ('book-rom', 'Romans', 'NEW', 45),
('book-1co', '1 Corinthians', 'NEW', 46), ('book-2co', '2 Corinthians', 'NEW', 47),
('book-gal', 'Galatians', 'NEW', 48), ('book-eph', 'Ephesians', 'NEW', 49),
('book-phi', 'Philippians', 'NEW', 50), ('book-col', 'Colossians', 'NEW', 51),
('book-1th', '1 Thessalonians', 'NEW', 52), ('book-2th', '2 Thessalonians', 'NEW', 53),
('book-1ti', '1 Timothy', 'NEW', 54), ('book-2ti', '2 Timothy', 'NEW', 55),
('book-tit', 'Titus', 'NEW', 56), ('book-phm', 'Philemon', 'NEW', 57),
('book-heb', 'Hebrews', 'NEW', 58), ('book-jam', 'James', 'NEW', 59),
('book-1pe', '1 Peter', 'NEW', 60), ('book-2pe', '2 Peter', 'NEW', 61),
('book-1jo', '1 John', 'NEW', 62), ('book-2jo', '2 John', 'NEW', 63),
('book-3jo', '3 John', 'NEW', 64), ('book-jud', 'Jude', 'NEW', 65),
('book-rev', 'Revelation', 'NEW', 66);

-- Insert John 3:16 in KJV and Swahili
INSERT INTO bible_verses (id, book_id, chapter, verse, text, translation) VALUES
('verse-kjv-john316', 'book-joh', 3, 16, 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', 'KJV'),
('verse-swh-john316', 'book-joh', 3, 16, 'Kwa maana Mungu aliupenda ulimwengu hivi, hata akamtoa Mwana wake wa pekee, ili kila amwaminiye asipotee, bali awe na uzima wa milele.', 'SWAHILI');

-- Sample reading plan
INSERT INTO bible_reading_plans (id, name, description, days) VALUES
('plan-1', 'New Testament in 90 Days', 'Read the entire New Testament in 90 days.', 90);
INSERT INTO bible_reading_plan_days (id, plan_id, day_number, book_id, start_chapter, end_chapter) VALUES
('pd-1', 'plan-1', 1, 'book-mat', 1, 2),
('pd-2', 'plan-1', 2, 'book-mat', 3, 4);

-- Daily devotional
INSERT INTO bible_devotionals (id, title, verse_ref, content, author, date) VALUES
('dev-20260618', 'God So Loved', 'John 3:16', 'Gods love is immense. He gave His only Son so that we may have eternal life. Reflect on this love today.', 'PCEA Connect', CURRENT_DATE);
