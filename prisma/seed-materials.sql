-- =====================================================
-- SQL INSERT Query untuk Material PT-PKS
-- Jalankan di pgAdmin menggunakan Query Tool
-- Generated: 2026-01-15
-- =====================================================

-- STEP 1: Insert Kategori Material
INSERT INTO "KategoriMaterial" ("id", "companyId", "name", "description", "createdAt", "updatedAt") VALUES
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Sparepart Bearing', 'Bearing dan komponen terkait', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Sparepart Valve', 'Valve dan komponen terkait', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Sparepart Elbo', 'Elbow dan sambungan pipa', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Sparepart Tee', 'Tee dan sambungan pipa T', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Sparepart', 'Sparepart umum', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Consumable', 'Bahan habis pakai', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Lubrican', 'Pelumas dan grease', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Cat', 'Cat dan thinner', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Electrikal', 'Komponen elektrikal', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Alat Laboratorium', 'Peralatan lab', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Hasil Produk', 'Hasil produksi PKS', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Bahan Baku', 'Bahan baku produksi', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Fuel', 'Bahan bakar', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Chemical', 'Bahan kimia', NOW(), NOW());

-- STEP 2: Insert Satuan Material
INSERT INTO "SatuanMaterial" ("id", "companyId", "name", "symbol", "createdAt", "updatedAt") VALUES
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Pcs', 'pcs', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Kg', 'kg', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Liter', 'L', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Meter', 'm', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Roll', 'roll', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Set', 'set', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Unit', 'unit', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Pail', 'pail', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Kaleng', 'kaleng', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Bungkus', 'bks', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Buah', 'buah', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Batang', 'btg', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Pasang', 'psg', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Sak', 'sak', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Botol', 'btl', NOW(), NOW()),
(gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), 'Ml', 'ml', NOW(), NOW());

-- STEP 3: Insert Material (Part 1: 1-50)
INSERT INTO "Material" ("id", "companyId", "kategoriId", "satuanId", "name", "code", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.id, k.id, s.id, m.name, m.code, NULL, NOW(), NOW()
FROM "Company" c, "KategoriMaterial" k, "SatuanMaterial" s,
(VALUES
('ASB Bearing UCF 310', 'MAT-001', 'Sparepart Bearing', 'Pcs'),
('ASB UCF 315', 'MAT-002', 'Sparepart Bearing', 'Pcs'),
('TIMKEN H 316', 'MAT-003', 'Sparepart Bearing', 'Pcs'),
('TIMKEN SNT 516-613', 'MAT-004', 'Sparepart Bearing', 'Pcs'),
('FYH BEARING UCF 210 J', 'MAT-005', 'Sparepart Bearing', 'Pcs'),
('FYH BEARING UCF 208 J', 'MAT-006', 'Sparepart Bearing', 'Pcs'),
('TIMKEN TSNG 515', 'MAT-007', 'Sparepart Bearing', 'Pcs'),
('TIMKEN TSNG 516', 'MAT-008', 'Sparepart Bearing', 'Pcs'),
('TIMKEN 22216KEJW33C3', 'MAT-009', 'Sparepart Bearing', 'Pcs'),
('TIMKEN 22213KEJW33C3', 'MAT-010', 'Sparepart Bearing', 'Pcs'),
('TIMKEN 22218EJW33', 'MAT-011', 'Sparepart Bearing', 'Pcs'),
('TIMKEN SR 140 X 12,5', 'MAT-012', 'Sparepart Bearing', 'Pcs'),
('TSNG 520', 'MAT-013', 'Sparepart Bearing', 'Pcs'),
('TIMKEN TSNG 522', 'MAT-014', 'Sparepart Bearing', 'Pcs'),
('TIMKEN TSNG 528', 'MAT-015', 'Sparepart Bearing', 'Pcs'),
('TIMKEN HE 313', 'MAT-016', 'Sparepart Bearing', 'Pcs'),
('SKF 29422E', 'MAT-017', 'Sparepart Bearing', 'Pcs'),
('MECHANICAL SEAL', 'MAT-018', 'Sparepart Bearing', 'Pcs'),
('OIL SEAL TC 110-140-14', 'MAT-019', 'Sparepart Bearing', 'Pcs'),
('OIL SEAL TC 130-160-13', 'MAT-020', 'Sparepart Bearing', 'Pcs'),
('TIMKEN 6311-2RS-C3', 'MAT-021', 'Sparepart Bearing', 'Pcs'),
('TIMKEN 6311-2RS', 'MAT-022', 'Sparepart Bearing', 'Pcs'),
('TIMKEN 222117 KEJW 33C3', 'MAT-023', 'Sparepart Bearing', 'Pcs'),
('TIMKEN 29422 EJ', 'MAT-024', 'Sparepart Bearing', 'Pcs'),
('Ball Valve 1 inch', 'MAT-025', 'Sparepart Valve', 'Pcs'),
('Ball Valve 1/4 inch', 'MAT-026', 'Sparepart Valve', 'Pcs'),
('Ball Valve 2 inch', 'MAT-027', 'Sparepart Valve', 'Pcs'),
('Ball Valve 6 inch', 'MAT-028', 'Sparepart Valve', 'Pcs'),
('Ball Valve 1/2 inch', 'MAT-029', 'Sparepart Valve', 'Pcs'),
('Elbo Carbon 1.1/4 inch', 'MAT-030', 'Sparepart Elbo', 'Pcs'),
('Elbo Carbon 3 inch', 'MAT-031', 'Sparepart Elbo', 'Pcs'),
('Elbo Carbon 4 inch', 'MAT-032', 'Sparepart Elbo', 'Pcs'),
('Elbo Galvanis 3 inch', 'MAT-033', 'Sparepart Elbo', 'Pcs'),
('Elbo PVC 1 inch', 'MAT-034', 'Sparepart Elbo', 'Pcs'),
('Elbo PVC 2 inch', 'MAT-035', 'Sparepart Elbo', 'Pcs'),
('Elbow Pvc 3 inch', 'MAT-036', 'Sparepart Elbo', 'Pcs'),
('Elbo PVC 3/4 inch', 'MAT-037', 'Sparepart Elbo', 'Pcs'),
('Elbo Stanlis 3 inch', 'MAT-038', 'Sparepart Elbo', 'Pcs'),
('Elbow 1 inch', 'MAT-039', 'Sparepart Elbo', 'Pcs'),
('Elbow Carbon 6 inch', 'MAT-040', 'Sparepart Elbo', 'Pcs'),
('Elbow Galvanis 4 inch', 'MAT-041', 'Sparepart Elbo', 'Pcs'),
('Valve Butterfly', 'MAT-042', 'Sparepart Valve', 'Pcs'),
('Valve Neddle 1/2 inch', 'MAT-043', 'Sparepart Valve', 'Pcs'),
('Valve Steam 2 inch PN 16', 'MAT-044', 'Sparepart Valve', 'Pcs'),
('Valve Y-Strainer 4 inch PN 16', 'MAT-045', 'Sparepart Valve', 'Pcs'),
('ValveBall 1.1/2 inch', 'MAT-046', 'Sparepart Valve', 'Pcs'),
('ValveBall 4 inch', 'MAT-047', 'Sparepart Valve', 'Pcs'),
('ValveBall 8 inch', 'MAT-048', 'Sparepart Valve', 'Pcs'),
('Flange 3 inch PN 16', 'MAT-049', 'Sparepart Valve', 'Pcs'),
('Flange 4 inch PN 40', 'MAT-050', 'Sparepart Valve', 'Pcs')
) AS m(name, code, kategori, satuan)
WHERE c.code = 'PT-PKS' AND k.name = m.kategori AND k."companyId" = c.id AND s.name = m.satuan AND s."companyId" = c.id;

-- STEP 4: Insert Material (Part 2: 51-100)
INSERT INTO "Material" ("id", "companyId", "kategoriId", "satuanId", "name", "code", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.id, k.id, s.id, m.name, m.code, NULL, NOW(), NOW()
FROM "Company" c, "KategoriMaterial" k, "SatuanMaterial" s,
(VALUES
('Flange 6 inch PN 40', 'MAT-051', 'Sparepart Valve', 'Pcs'),
('T Dos', 'MAT-052', 'Sparepart Tee', 'Pcs'),
('T Karbon', 'MAT-053', 'Sparepart Tee', 'Pcs'),
('T PVC 2.1/2', 'MAT-054', 'Sparepart Tee', 'Pcs'),
('T Pipa 1 inch', 'MAT-055', 'Sparepart Tee', 'Pcs'),
('T Pipa 2 inch', 'MAT-056', 'Sparepart Tee', 'Pcs'),
('T Pvc 12 inch', 'MAT-057', 'Sparepart Tee', 'Pcs'),
('T Pvc 3 inch', 'MAT-058', 'Sparepart Tee', 'Pcs'),
('Fleksibel Coupling', 'MAT-059', 'Sparepart Valve', 'Pcs'),
('Baut 1/2 x 2.1/2', 'MAT-060', 'Consumable', 'Pcs'),
('Baut 5/8 x 2 1/2', 'MAT-061', 'Consumable', 'Pcs'),
('Baut 1 x 6', 'MAT-062', 'Consumable', 'Pcs'),
('Baut 1/2 x 1.1/2', 'MAT-063', 'Consumable', 'Pcs'),
('Baut 1/2 x 2 1/2', 'MAT-064', 'Consumable', 'Pcs'),
('Baut 1/2 x 3', 'MAT-065', 'Consumable', 'Pcs'),
('Baut 3/4 x 3', 'MAT-066', 'Consumable', 'Pcs'),
('Baut 3/4 x 6', 'MAT-067', 'Consumable', 'Pcs'),
('Baut 5/4 x 4', 'MAT-068', 'Consumable', 'Pcs'),
('Baut 5/8 x 3', 'MAT-069', 'Consumable', 'Pcs'),
('Baut 5/8 x 5', 'MAT-070', 'Consumable', 'Pcs'),
('Baut 7/8 x 6', 'MAT-071', 'Consumable', 'Pcs'),
('Mata Bor Besi 10 Mm', 'MAT-072', 'Consumable', 'Pcs'),
('Mata Bor Besi 18 Mm', 'MAT-073', 'Consumable', 'Pcs'),
('Mata Bor Besi 23 Mm', 'MAT-074', 'Consumable', 'Pcs'),
('Mata Bor Besi 12 Mm', 'MAT-075', 'Consumable', 'Pcs'),
('Mata Bor Besi 14 Mm', 'MAT-076', 'Consumable', 'Pcs'),
('Mata Bor Besi 24 Mm', 'MAT-077', 'Consumable', 'Pcs'),
('Mata Bor Besi 45 Mm', 'MAT-078', 'Consumable', 'Pcs'),
('Mata Bor Besi 6 Mm', 'MAT-079', 'Consumable', 'Pcs'),
('Mata Bor Besi 8 Mm', 'MAT-080', 'Consumable', 'Pcs'),
('Mata Bor Milling 12', 'MAT-081', 'Consumable', 'Pcs'),
('Mata Bor Milling 24', 'MAT-082', 'Consumable', 'Pcs'),
('Mata Bor Milling 8 Mm', 'MAT-083', 'Consumable', 'Pcs'),
('Grease Barlube 151 (Merah)', 'MAT-084', 'Lubrican', 'Pail'),
('Grease Barlube 174 (Hijau)', 'MAT-085', 'Lubrican', 'Pail'),
('Grease Barlube 19 (Hitam)', 'MAT-086', 'Lubrican', 'Pail'),
('Mobil Grease XHP 222 (Biru)', 'MAT-087', 'Lubrican', 'Pail'),
('Coolant Radiator', 'MAT-088', 'Lubrican', 'Liter'),
('Propan Red Mac-11620', 'MAT-089', 'Cat', 'Liter'),
('Propan Silver MHRC 18102', 'MAT-090', 'Cat', 'Liter'),
('Kuas Cat', 'MAT-091', 'Cat', 'Pcs'),
('Kuas Roll', 'MAT-092', 'Cat', 'Pcs'),
('Lem pipa', 'MAT-093', 'Consumable', 'Kaleng'),
('Tiner 5 liter', 'MAT-094', 'Cat', 'Kaleng'),
('Box Panasonic', 'MAT-095', 'Electrikal', 'Pcs'),
('Breaker', 'MAT-096', 'Electrikal', 'Pcs'),
('Carbon Brush', 'MAT-097', 'Electrikal', 'Pcs'),
('Contactor Lcid 18', 'MAT-098', 'Electrikal', 'Pcs'),
('Fiting lampu', 'MAT-099', 'Electrikal', 'Pcs'),
('Isolasi Listrik', 'MAT-100', 'Electrikal', 'Pcs')
) AS m(name, code, kategori, satuan)
WHERE c.code = 'PT-PKS' AND k.name = m.kategori AND k."companyId" = c.id AND s.name = m.satuan AND s."companyId" = c.id;

-- STEP 5: Insert Material (Part 3: 101-150)
INSERT INTO "Material" ("id", "companyId", "kategoriId", "satuanId", "name", "code", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.id, k.id, s.id, m.name, m.code, NULL, NOW(), NOW()
FROM "Company" c, "KategoriMaterial" k, "SatuanMaterial" s,
(VALUES
('Kabel', 'MAT-101', 'Electrikal', 'Roll'),
('Level switch Automatic JF-302', 'MAT-102', 'Electrikal', 'Pcs'),
('Limit Switch WICA 12-N', 'MAT-103', 'Electrikal', 'Pcs'),
('Hour Meter AC 220-240 V', 'MAT-104', 'Electrikal', 'Buah'),
('Potensio 10K Ohm', 'MAT-105', 'Electrikal', 'Pcs'),
('Potensio 5K Ohm', 'MAT-106', 'Electrikal', 'Pcs'),
('Pressure Gauge 150 Mm', 'MAT-107', 'Electrikal', 'Pcs'),
('Pressure Gauge Size 100 Mm', 'MAT-108', 'Electrikal', 'Pcs'),
('Naple Angin Sambungan selang 6', 'MAT-109', 'Electrikal', 'Pcs'),
('Over Load Lrd 22', 'MAT-110', 'Electrikal', 'Pcs'),
('Koil selenoid 220v AC', 'MAT-111', 'Electrikal', 'Pcs'),
('Selenoid 220v AC', 'MAT-112', 'Electrikal', 'Pcs'),
('KAPASITOR', 'MAT-113', 'Electrikal', 'Pcs'),
('Kaca Kap Las Hitam', 'MAT-114', 'Consumable', 'Pcs'),
('Kaca Kap Las Putih', 'MAT-115', 'Consumable', 'Pcs'),
('Kapur Besi', 'MAT-116', 'Consumable', 'Batang'),
('Kawat Las LB 7016 3.2', 'MAT-117', 'Consumable', 'Kg'),
('Kawat Las LB 7018 4.0', 'MAT-118', 'Consumable', 'Kg'),
('Kawat Las RB 6013 4.0', 'MAT-119', 'Consumable', 'Kg'),
('Kawat Las RB 6013 3.2', 'MAT-120', 'Consumable', 'Kg'),
('Sarung Tangan Las', 'MAT-121', 'Consumable', 'Pasang'),
('Nozle No 2', 'MAT-122', 'Consumable', 'Pcs'),
('Nozle No 3', 'MAT-123', 'Consumable', 'Pcs'),
('Nozle Dalam Cutting Plasma', 'MAT-124', 'Consumable', 'Pcs'),
('Nozle Kramik Cutting Plasma', 'MAT-125', 'Consumable', 'Pcs'),
('Nozle Luar Cutting Plasma', 'MAT-126', 'Consumable', 'Pcs'),
('Batu Grenda Gosok 7 inch', 'MAT-127', 'Consumable', 'Pcs'),
('Batu Grenda Asah Duduk 8 inch', 'MAT-128', 'Consumable', 'Pcs'),
('Batu Grenda Gosok 4 inch', 'MAT-129', 'Consumable', 'Pcs'),
('Batu Grenda Potong 4 inch', 'MAT-130', 'Consumable', 'Pcs'),
('Batu Grenda Potong 7 inch', 'MAT-131', 'Consumable', 'Pcs'),
('Redusher 2x1', 'MAT-132', 'Consumable', 'Pcs'),
('WD 40', 'MAT-133', 'Consumable', 'Pcs'),
('Water Flowmeter', 'MAT-134', 'Alat Laboratorium', 'Set'),
('Batang Pengaduk Kaca Pyrex', 'MAT-135', 'Alat Laboratorium', 'Pcs'),
('Botol Reagent', 'MAT-136', 'Alat Laboratorium', 'Pcs'),
('Colorimeter DR 900', 'MAT-137', 'Alat Laboratorium', 'Unit'),
('Corong Kaca Kecil', 'MAT-138', 'Alat Laboratorium', 'Pcs'),
('Corong Kaca Menengah', 'MAT-139', 'Alat Laboratorium', 'Pcs'),
('Drop Pippete Kaca', 'MAT-140', 'Alat Laboratorium', 'Pcs'),
('Elenmeyer 250 Ml Pyrex', 'MAT-141', 'Alat Laboratorium', 'Pcs'),
('Labu Sokhlet', 'MAT-142', 'Alat Laboratorium', 'Pcs'),
('Pignometer', 'MAT-143', 'Alat Laboratorium', 'Pcs'),
('Segel Double Lock', 'MAT-144', 'Alat Laboratorium', 'Buah'),
('Spatula Stainless', 'MAT-145', 'Alat Laboratorium', 'Pcs'),
('Cangkang', 'MAT-146', 'Hasil Produk', 'Kg'),
('Fiber', 'MAT-147', 'Hasil Produk', 'Kg'),
('Inti Sawit Kernel', 'MAT-148', 'Hasil Produk', 'Kg'),
('Minyak Mentah Sawit CPO', 'MAT-149', 'Hasil Produk', 'Kg'),
('Jangkos Tandan Kosong', 'MAT-150', 'Hasil Produk', 'Kg')
) AS m(name, code, kategori, satuan)
WHERE c.code = 'PT-PKS' AND k.name = m.kategori AND k."companyId" = c.id AND s.name = m.satuan AND s."companyId" = c.id;

-- STEP 6: Insert Material (Part 4: 151-199)
INSERT INTO "Material" ("id", "companyId", "kategoriId", "satuanId", "name", "code", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.id, k.id, s.id, m.name, m.code, NULL, NOW(), NOW()
FROM "Company" c, "KategoriMaterial" k, "SatuanMaterial" s,
(VALUES
('Tandan Buah Segar TBS', 'MAT-151', 'Bahan Baku', 'Kg'),
('Solar', 'MAT-152', 'Fuel', 'Liter'),
('Pertalite', 'MAT-153', 'Fuel', 'Liter'),
('ALUM S-1009', 'MAT-154', 'Chemical', 'Kg'),
('Bakteri', 'MAT-155', 'Chemical', 'Pail'),
('CALSIUM CARBONAT CaCo2', 'MAT-156', 'Chemical', 'Kg'),
('FLOK ANIONIK', 'MAT-157', 'Chemical', 'Kg'),
('Garam Non Yodium', 'MAT-158', 'Chemical', 'Kg'),
('Iso Prophyl Alcohol 96 98 persen', 'MAT-159', 'Chemical', 'Pail'),
('KOSTIK SODA', 'MAT-160', 'Chemical', 'Kg'),
('N-Hexana', 'MAT-161', 'Chemical', 'Pail'),
('S-2002 Alkalinity Booster', 'MAT-162', 'Chemical', 'Kg'),
('S-2101 Oxygen Scavenger', 'MAT-163', 'Chemical', 'Kg'),
('S-2201 Scale Inhibitor', 'MAT-164', 'Chemical', 'Kg'),
('SODA ASH', 'MAT-165', 'Chemical', 'Kg'),
('SSO-1', 'MAT-166', 'Chemical', 'Botol'),
('SSO-2', 'MAT-167', 'Chemical', 'Botol'),
('SSO-3', 'MAT-168', 'Chemical', 'Botol'),
('Valve Globe 1 inch PN 40', 'MAT-169', 'Sparepart Valve', 'Pcs'),
('Valve Globe 2 inch PN 16', 'MAT-170', 'Sparepart Valve', 'Pcs'),
('Valve Globe 3 inch PN 40', 'MAT-171', 'Sparepart Valve', 'Pcs'),
('V-Belt B55', 'MAT-172', 'Sparepart', 'Pcs'),
('V-Belt C-96 Bando', 'MAT-173', 'Sparepart', 'Pcs'),
('V-Belt C-99 Bando', 'MAT-174', 'Sparepart', 'Pcs'),
('V-Belt C-85 Bando', 'MAT-175', 'Sparepart', 'Pcs'),
('V-Belt C-142 Bando', 'MAT-176', 'Sparepart', 'Pcs'),
('V-Belt SPB 2240 Bando', 'MAT-177', 'Sparepart', 'Pcs'),
('V-Belt B 66', 'MAT-178', 'Sparepart', 'Pcs'),
('V-Belt B-57', 'MAT-179', 'Sparepart', 'Pcs'),
('Packing Pintu Rebusan 1200mm x 7.5mm', 'MAT-180', 'Sparepart', 'Pcs'),
('Packing Pintu Rebusan 1200mm x 9mm', 'MAT-181', 'Sparepart', 'Pcs'),
('Gasked Chanel Solicone Sintetic RED', 'MAT-182', 'Sparepart', 'Pcs'),
('Gland Packing', 'MAT-183', 'Sparepart', 'Meter'),
('Gland Packing GALON 1 inch', 'MAT-184', 'Sparepart', 'Meter'),
('Gland Packing Teflon', 'MAT-185', 'Sparepart', 'Meter'),
('Karet Vibrating Screen', 'MAT-186', 'Sparepart', 'Pcs')
) AS m(name, code, kategori, satuan)
WHERE c.code = 'PT-PKS' AND k.name = m.kategori AND k."companyId" = c.id AND s.name = m.satuan AND s."companyId" = c.id;

-- =====================================================
-- Verifikasi hasil insert
-- =====================================================
SELECT 'KategoriMaterial' as table_name, COUNT(*) as total FROM "KategoriMaterial" WHERE "companyId" = (SELECT id FROM "Company" WHERE code = 'PT-PKS')
UNION ALL
SELECT 'SatuanMaterial', COUNT(*) FROM "SatuanMaterial" WHERE "companyId" = (SELECT id FROM "Company" WHERE code = 'PT-PKS')
UNION ALL
SELECT 'Material', COUNT(*) FROM "Material" WHERE "companyId" = (SELECT id FROM "Company" WHERE code = 'PT-PKS');
