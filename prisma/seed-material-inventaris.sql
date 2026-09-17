-- =====================================================
-- SQL INSERT Query untuk MaterialInventaris PT-PKS
-- Jalankan di pgAdmin menggunakan Query Tool
-- Generated: 2026-01-15
-- =====================================================

-- STEP 1: Insert Kategori Material (jika belum ada)
INSERT INTO "KategoriMaterial" ("id", "companyId", "name", "description", "createdAt", "updatedAt") 
SELECT gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), name, description, NOW(), NOW()
FROM (VALUES
('Sparepart Bearing', 'Bearing dan komponen terkait'),
('Sparepart Valve', 'Valve dan komponen terkait'),
('Sparepart Elbo', 'Elbow dan sambungan pipa'),
('Sparepart Tee', 'Tee dan sambungan pipa T'),
('Sparepart', 'Sparepart umum'),
('Consumable', 'Bahan habis pakai'),
('Lubrican', 'Pelumas dan grease'),
('Cat', 'Cat dan thinner'),
('Electrikal', 'Komponen elektrikal'),
('Alat Laboratorium', 'Peralatan lab'),
('Hasil Produk', 'Hasil produksi PKS'),
('Bahan Baku', 'Bahan baku produksi'),
('Fuel', 'Bahan bakar'),
('Chemical', 'Bahan kimia')
) AS v(name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM "KategoriMaterial" km 
    WHERE km.name = v.name AND km."companyId" = (SELECT id FROM "Company" WHERE code = 'PT-PKS')
);

-- STEP 2: Insert Satuan Material (jika belum ada)
INSERT INTO "SatuanMaterial" ("id", "companyId", "name", "symbol", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, (SELECT id FROM "Company" WHERE code = 'PT-PKS'), name, symbol, NOW(), NOW()
FROM (VALUES
('Pcs', 'pcs'),
('Kg', 'kg'),
('Liter', 'L'),
('Meter', 'm'),
('Roll', 'roll'),
('Set', 'set'),
('Unit', 'unit'),
('Pail', 'pail'),
('Kaleng', 'kaleng'),
('Bungkus', 'bks'),
('Buah', 'buah'),
('Batang', 'btg'),
('Pasang', 'psg'),
('Sak', 'sak'),
('Botol', 'btl')
) AS v(name, symbol)
WHERE NOT EXISTS (
    SELECT 1 FROM "SatuanMaterial" sm 
    WHERE sm.name = v.name AND sm."companyId" = (SELECT id FROM "Company" WHERE code = 'PT-PKS')
);

-- STEP 3: Insert MaterialInventaris (Part 1: 1-50)
INSERT INTO "MaterialInventaris" ("id", "companyId", "partNumber", "namaMaterial", "kategoriMaterialId", "satuanMaterialId", "minStock", "stockOnHand", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.id, m.partNumber, m.namaMaterial, k.id, s.id, m.minStock, m.stockOnHand, NOW(), NOW()
FROM "Company" c, "KategoriMaterial" k, "SatuanMaterial" s,
(VALUES
('MAT-001', 'ASB Bearing UCF 310', 'Sparepart Bearing', 'Pcs', 2, 0),
('MAT-002', 'ASB UCF 315', 'Sparepart Bearing', 'Pcs', 2, 2),
('MAT-003', 'TIMKEN H 316', 'Sparepart Bearing', 'Pcs', 2, 1),
('MAT-004', 'TIMKEN SNT 516-613', 'Sparepart Bearing', 'Pcs', 2, 2),
('MAT-005', 'FYH BEARING UCF 210 J', 'Sparepart Bearing', 'Pcs', 2, 5),
('MAT-006', 'FYH BEARING UCF 208 J', 'Sparepart Bearing', 'Pcs', 2, 3),
('MAT-007', 'TIMKEN TSNG 515', 'Sparepart Bearing', 'Pcs', 2, 2),
('MAT-008', 'TIMKEN TSNG 516', 'Sparepart Bearing', 'Pcs', 2, 10),
('MAT-009', 'TIMKEN 22216KEJW33C3', 'Sparepart Bearing', 'Pcs', 2, 2),
('MAT-010', 'TIMKEN 22213KEJW33C3', 'Sparepart Bearing', 'Pcs', 2, 1),
('MAT-011', 'TIMKEN 22218EJW33', 'Sparepart Bearing', 'Pcs', 2, 0),
('MAT-012', 'TIMKEN SR 140 X 12,5', 'Sparepart Bearing', 'Pcs', 2, 4),
('MAT-013', 'TSNG 520', 'Sparepart Bearing', 'Pcs', 2, 14),
('MAT-014', 'TIMKEN TSNG 522', 'Sparepart Bearing', 'Pcs', 2, 2),
('MAT-015', 'TIMKEN TSNG 528', 'Sparepart Bearing', 'Pcs', 2, 1),
('MAT-016', 'TIMKEN HE 313', 'Sparepart Bearing', 'Pcs', 2, 0),
('MAT-017', 'SKF 29422E', 'Sparepart Bearing', 'Pcs', 2, 0),
('MAT-018', 'MECHANICAL SEAL', 'Sparepart Bearing', 'Pcs', 5, 4),
('MAT-019', 'OIL SEAL TC 110-140-14', 'Sparepart Bearing', 'Pcs', 5, 2),
('MAT-020', 'OIL SEAL TC 130-160-13', 'Sparepart Bearing', 'Pcs', 5, 1),
('MAT-021', 'TIMKEN 6311-2RS-C3', 'Sparepart Bearing', 'Pcs', 2, 3),
('MAT-022', 'TIMKEN 6311-2RS', 'Sparepart Bearing', 'Pcs', 2, 0),
('MAT-023', 'TIMKEN 222117 KEJW 33C3', 'Sparepart Bearing', 'Pcs', 2, 1),
('MAT-024', 'TIMKEN 29422 EJ', 'Sparepart Bearing', 'Pcs', 2, 1),
('MAT-025', 'Ball Valve 1 inch', 'Sparepart Valve', 'Pcs', 2, 1),
('MAT-026', 'Ball Valve 1/4 inch', 'Sparepart Valve', 'Pcs', 2, 18),
('MAT-027', 'Ball Valve 2 inch', 'Sparepart Valve', 'Pcs', 2, 0),
('MAT-028', 'Ball Valve 6 inch', 'Sparepart Valve', 'Pcs', 2, 0),
('MAT-029', 'Ball Valve 1/2 inch', 'Sparepart Valve', 'Pcs', 2, 7),
('MAT-030', 'Elbo Carbon 1.1/4 inch', 'Sparepart Elbo', 'Pcs', 4, 285),
('MAT-031', 'Elbo Carbon 3 inch', 'Sparepart Elbo', 'Pcs', 4, 0),
('MAT-032', 'Elbo Carbon 4 inch', 'Sparepart Elbo', 'Pcs', 4, 6),
('MAT-033', 'Elbo Galvanis 3 inch', 'Sparepart Elbo', 'Pcs', 4, 0),
('MAT-034', 'Elbo PVC 1 inch', 'Sparepart Elbo', 'Pcs', 4, 1),
('MAT-035', 'Elbo PVC 2 inch', 'Sparepart Elbo', 'Pcs', 4, 5),
('MAT-036', 'Elbow Pvc 3 inch', 'Sparepart Elbo', 'Pcs', 4, 6),
('MAT-037', 'Elbo PVC 3/4 inch', 'Sparepart Elbo', 'Pcs', 4, 6),
('MAT-038', 'Elbo Stanlis 3 inch', 'Sparepart Elbo', 'Pcs', 4, 3),
('MAT-039', 'Elbow 1 inch', 'Sparepart Elbo', 'Pcs', 4, 0),
('MAT-040', 'Elbow Carbon 6 inch', 'Sparepart Elbo', 'Pcs', 4, 1),
('MAT-041', 'Elbow Galvanis 4 inch', 'Sparepart Elbo', 'Pcs', 4, 3),
('MAT-042', 'Valve Butterfly', 'Sparepart Valve', 'Pcs', 2, 1),
('MAT-043', 'Valve Neddle 1/2 inch', 'Sparepart Valve', 'Pcs', 2, 2),
('MAT-044', 'Valve Steam 2 inch PN 16', 'Sparepart Valve', 'Pcs', 2, 2),
('MAT-045', 'Valve Y-Strainer 4 inch PN 16', 'Sparepart Valve', 'Pcs', 2, 2),
('MAT-046', 'ValveBall 1.1/2 inch', 'Sparepart Valve', 'Pcs', 2, 0),
('MAT-047', 'ValveBall 4 inch', 'Sparepart Valve', 'Pcs', 2, 2),
('MAT-048', 'ValveBall 8 inch', 'Sparepart Valve', 'Pcs', 2, 1),
('MAT-049', 'Flange 3 inch PN 16', 'Sparepart Valve', 'Pcs', 4, 4),
('MAT-050', 'Flange 4 inch PN 40', 'Sparepart Valve', 'Pcs', 4, 0)
) AS m(partNumber, namaMaterial, kategori, satuan, minStock, stockOnHand)
WHERE c.code = 'PT-PKS' AND k.name = m.kategori AND k."companyId" = c.id AND s.name = m.satuan AND s."companyId" = c.id;

-- STEP 4: Insert MaterialInventaris (Part 2: 51-100)
INSERT INTO "MaterialInventaris" ("id", "companyId", "partNumber", "namaMaterial", "kategoriMaterialId", "satuanMaterialId", "minStock", "stockOnHand", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.id, m.partNumber, m.namaMaterial, k.id, s.id, m.minStock, m.stockOnHand, NOW(), NOW()
FROM "Company" c, "KategoriMaterial" k, "SatuanMaterial" s,
(VALUES
('MAT-051', 'Flange 6 inch PN 40', 'Sparepart Valve', 'Pcs', 4, 14),
('MAT-052', 'T Dos', 'Sparepart Tee', 'Pcs', 2, 2),
('MAT-053', 'T Karbon', 'Sparepart Tee', 'Pcs', 5, 12),
('MAT-054', 'T PVC 2.1/2', 'Sparepart Tee', 'Pcs', 2, 5),
('MAT-055', 'T Pipa 1 inch', 'Sparepart Tee', 'Pcs', 2, 0),
('MAT-056', 'T Pipa 2 inch', 'Sparepart Tee', 'Pcs', 2, 4),
('MAT-057', 'T Pvc 12 inch', 'Sparepart Tee', 'Pcs', 2, 0),
('MAT-058', 'T Pvc 3 inch', 'Sparepart Tee', 'Pcs', 2, 0),
('MAT-059', 'Fleksibel Coupling', 'Sparepart Valve', 'Pcs', 15, 3),
('MAT-060', 'Baut 1/2 x 2.1/2', 'Consumable', 'Pcs', 20, 0),
('MAT-061', 'Baut 5/8 x 2 1/2', 'Consumable', 'Pcs', 20, 0),
('MAT-062', 'Baut 1 x 6', 'Consumable', 'Pcs', 20, 28),
('MAT-063', 'Baut 1/2 x 1.1/2', 'Consumable', 'Pcs', 20, 40),
('MAT-064', 'Baut 1/2 x 2 1/2', 'Consumable', 'Pcs', 20, 40),
('MAT-065', 'Baut 1/2 x 3', 'Consumable', 'Pcs', 20, 0),
('MAT-066', 'Baut 3/4 x 3', 'Consumable', 'Pcs', 20, 55),
('MAT-067', 'Baut 3/4 x 6', 'Consumable', 'Pcs', 20, 45),
('MAT-068', 'Baut 5/4 x 4', 'Consumable', 'Pcs', 20, 14),
('MAT-069', 'Baut 5/8 x 3', 'Consumable', 'Pcs', 20, 20),
('MAT-070', 'Baut 5/8 x 5', 'Consumable', 'Pcs', 20, 50),
('MAT-071', 'Baut 7/8 x 6', 'Consumable', 'Pcs', 20, 15),
('MAT-072', 'Mata Bor Besi 10 Mm', 'Consumable', 'Pcs', 2, 2),
('MAT-073', 'Mata Bor Besi 18 Mm', 'Consumable', 'Pcs', 2, 1),
('MAT-074', 'Mata Bor Besi 23 Mm', 'Consumable', 'Pcs', 2, 1),
('MAT-075', 'Mata Bor Besi 12 Mm', 'Consumable', 'Pcs', 2, 0),
('MAT-076', 'Mata Bor Besi 14 Mm', 'Consumable', 'Pcs', 2, 0),
('MAT-077', 'Mata Bor Besi 24 Mm', 'Consumable', 'Pcs', 2, 1),
('MAT-078', 'Mata Bor Besi 45 Mm', 'Consumable', 'Pcs', 2, 0),
('MAT-079', 'Mata Bor Besi 6 Mm', 'Consumable', 'Pcs', 2, 1),
('MAT-080', 'Mata Bor Besi 8 Mm', 'Consumable', 'Pcs', 2, 4),
('MAT-081', 'Mata Bor Milling 12', 'Consumable', 'Pcs', 2, 2),
('MAT-082', 'Mata Bor Milling 24', 'Consumable', 'Pcs', 2, 0),
('MAT-083', 'Mata Bor Milling 8 Mm', 'Consumable', 'Pcs', 2, 4),
('MAT-084', 'Grease Barlube 151 Merah', 'Lubrican', 'Pail', 1, 0),
('MAT-085', 'Grease Barlube 174 Hijau', 'Lubrican', 'Pail', 1, 3),
('MAT-086', 'Grease Barlube 19 Hitam', 'Lubrican', 'Pail', 1, 6),
('MAT-087', 'Mobil Grease XHP 222 Biru', 'Lubrican', 'Pail', 1, 1),
('MAT-088', 'Coolant Radiator', 'Lubrican', 'Liter', 50, 0),
('MAT-089', 'Propan Red Mac-11620', 'Cat', 'Liter', 5, 2),
('MAT-090', 'Propan Silver MHRC 18102', 'Cat', 'Liter', 5, 0),
('MAT-091', 'Kuas Cat', 'Cat', 'Pcs', 2, 2),
('MAT-092', 'Kuas Roll', 'Cat', 'Pcs', 2, 1),
('MAT-093', 'Lem pipa', 'Consumable', 'Kaleng', 2, 0),
('MAT-094', 'Tiner 5 liter', 'Cat', 'Kaleng', 2, 2),
('MAT-095', 'Box Panasonic', 'Electrikal', 'Pcs', 3, 0),
('MAT-096', 'Breaker', 'Electrikal', 'Pcs', 4, 0),
('MAT-097', 'Carbon Brush', 'Electrikal', 'Pcs', 5, 0),
('MAT-098', 'Contactor Lcid 18', 'Electrikal', 'Pcs', 8, 0),
('MAT-099', 'Fiting lampu', 'Electrikal', 'Pcs', 5, 0),
('MAT-100', 'Isolasi Listrik', 'Electrikal', 'Pcs', 5, 0)
) AS m(partNumber, namaMaterial, kategori, satuan, minStock, stockOnHand)
WHERE c.code = 'PT-PKS' AND k.name = m.kategori AND k."companyId" = c.id AND s.name = m.satuan AND s."companyId" = c.id;

-- STEP 5: Insert MaterialInventaris (Part 3: 101-150)
INSERT INTO "MaterialInventaris" ("id", "companyId", "partNumber", "namaMaterial", "kategoriMaterialId", "satuanMaterialId", "minStock", "stockOnHand", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.id, m.partNumber, m.namaMaterial, k.id, s.id, m.minStock, m.stockOnHand, NOW(), NOW()
FROM "Company" c, "KategoriMaterial" k, "SatuanMaterial" s,
(VALUES
('MAT-101', 'Kabel', 'Electrikal', 'Roll', 4, 0),
('MAT-102', 'Level switch Automatic JF-302', 'Electrikal', 'Pcs', 4, 0),
('MAT-103', 'Limit Switch WICA 12-N', 'Electrikal', 'Pcs', 4, 1),
('MAT-104', 'Potensio 10K Ohm', 'Electrikal', 'Pcs', 5, 5),
('MAT-105', 'Potensio 5K Ohm', 'Electrikal', 'Pcs', 5, 5),
('MAT-106', 'Pressure Gauge 150 Mm', 'Electrikal', 'Pcs', 3, 6),
('MAT-107', 'Pressure Gauge Size 100 Mm', 'Electrikal', 'Pcs', 3, 12),
('MAT-108', 'Naple Angin Sambungan selang 6', 'Electrikal', 'Pcs', 5, 47),
('MAT-109', 'Naple Fiting Pneumatic wipro 6', 'Electrikal', 'Pcs', 5, 41),
('MAT-110', 'Over Load Lrd 22', 'Electrikal', 'Pcs', 8, 1),
('MAT-111', 'Thermometer 6 inch 150 mm Buttom Conn', 'Electrikal', 'Pcs', 2, 5),
('MAT-112', 'Thermometer 6 inch 150 Mm Back Conn', 'Electrikal', 'Pcs', 2, 3),
('MAT-113', 'Koil selenoid 220v AC', 'Electrikal', 'Pcs', 2, 15),
('MAT-114', 'Selenoid 220v AC', 'Electrikal', 'Pcs', 5, 0),
('MAT-115', 'KAPASITOR', 'Electrikal', 'Pcs', 3, 1),
('MAT-116', 'Kaca Kap Las Hitam', 'Consumable', 'Pcs', 5, 10),
('MAT-117', 'Kaca Kap Las Putih', 'Consumable', 'Pcs', 10, 30),
('MAT-118', 'Kapur Besi', 'Consumable', 'Batang', 10, 12),
('MAT-119', 'Kawat Las LB 7016 3.2', 'Consumable', 'Kg', 10, 5),
('MAT-120', 'Kawat Las LB 7018 4.0', 'Consumable', 'Kg', 5, 0),
('MAT-121', 'Kawat Las RB 6013 4.0', 'Consumable', 'Kg', 10, 100),
('MAT-122', 'Kawat Las RB 6013 3.2', 'Consumable', 'Kg', 10, 20),
('MAT-123', 'Sarung Tangan Las', 'Consumable', 'Pasang', 6, 0),
('MAT-124', 'Nozle No 2', 'Consumable', 'Pcs', 5, 6),
('MAT-125', 'Nozle No 3', 'Consumable', 'Pcs', 5, 6),
('MAT-126', 'Nozle Dalam Cutting Plasma', 'Consumable', 'Pcs', 5, 7),
('MAT-127', 'Nozle Kramik Cutting Plasma', 'Consumable', 'Pcs', 5, 15),
('MAT-128', 'Nozle Luar Cutting Plasma', 'Consumable', 'Pcs', 5, 8),
('MAT-129', 'Batu Grenda Gosok 7 inch', 'Consumable', 'Pcs', 10, 0),
('MAT-130', 'Batu Grenda Asah Duduk 8 inch', 'Consumable', 'Pcs', 4, 2),
('MAT-131', 'Batu Grenda Gosok 4 inch', 'Consumable', 'Pcs', 10, 2),
('MAT-132', 'Batu Grenda Potong 4 inch', 'Consumable', 'Pcs', 5, 2),
('MAT-133', 'Batu Grenda Potong 7 inch', 'Consumable', 'Pcs', 5, 105),
('MAT-134', 'Redusher 2x1', 'Consumable', 'Pcs', 5, 26),
('MAT-135', 'WD 40', 'Consumable', 'Pcs', 2, 1),
('MAT-136', 'Water Flowmeter', 'Alat Laboratorium', 'Set', 1, 1),
('MAT-137', 'Batang Pengaduk Kaca Pyrex', 'Alat Laboratorium', 'Pcs', 2, 2),
('MAT-138', 'Botol Reagent', 'Alat Laboratorium', 'Pcs', 2, 20),
('MAT-139', 'Colorimeter DR 900', 'Alat Laboratorium', 'Unit', 1, 1),
('MAT-140', 'Corong Kaca Kecil', 'Alat Laboratorium', 'Pcs', 3, 4),
('MAT-141', 'Corong Kaca Menengah', 'Alat Laboratorium', 'Pcs', 3, 4),
('MAT-142', 'Drop Pippete Kaca', 'Alat Laboratorium', 'Pcs', 3, 5),
('MAT-143', 'Elenmeyer 250 Ml Pyrex', 'Alat Laboratorium', 'Pcs', 6, 13),
('MAT-144', 'Labu Sokhlet', 'Alat Laboratorium', 'Pcs', 6, 5),
('MAT-145', 'Pignometer', 'Alat Laboratorium', 'Pcs', 2, 3),
('MAT-146', 'Segel Double Lock', 'Alat Laboratorium', 'Buah', 500, 800),
('MAT-147', 'Spatula Stainless', 'Alat Laboratorium', 'Pcs', 2, 3),
('MAT-148', 'Cangkang', 'Hasil Produk', 'Kg', 0, 0),
('MAT-149', 'Fiber', 'Hasil Produk', 'Kg', 0, 0),
('MAT-150', 'Inti Sawit Kernel', 'Hasil Produk', 'Kg', 0, 0)
) AS m(partNumber, namaMaterial, kategori, satuan, minStock, stockOnHand)
WHERE c.code = 'PT-PKS' AND k.name = m.kategori AND k."companyId" = c.id AND s.name = m.satuan AND s."companyId" = c.id;

-- STEP 6: Insert MaterialInventaris (Part 4: 151-186)
INSERT INTO "MaterialInventaris" ("id", "companyId", "partNumber", "namaMaterial", "kategoriMaterialId", "satuanMaterialId", "minStock", "stockOnHand", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.id, m.partNumber, m.namaMaterial, k.id, s.id, m.minStock, m.stockOnHand, NOW(), NOW()
FROM "Company" c, "KategoriMaterial" k, "SatuanMaterial" s,
(VALUES
('MAT-151', 'Minyak Mentah Sawit CPO', 'Hasil Produk', 'Kg', 0, 0),
('MAT-152', 'Jangkos Tandan Kosong', 'Hasil Produk', 'Kg', 0, 0),
('MAT-153', 'Tandan Buah Segar TBS', 'Bahan Baku', 'Kg', 0, 0),
('MAT-154', 'Solar', 'Fuel', 'Liter', 2000, 1000),
('MAT-155', 'Pertalite', 'Fuel', 'Liter', 5, 0),
('MAT-156', 'ALUM S-1009', 'Chemical', 'Kg', 200, 0),
('MAT-157', 'Bakteri', 'Chemical', 'Pail', 0, 0),
('MAT-158', 'CALSIUM CARBONAT CaCo2', 'Chemical', 'Kg', 10000, 0),
('MAT-159', 'FLOK ANIONIK', 'Chemical', 'Kg', 50, 0),
('MAT-160', 'Garam Non Yodium', 'Chemical', 'Kg', 600, 0),
('MAT-161', 'Iso Prophyl Alcohol 96 98 persen', 'Chemical', 'Pail', 2, 0),
('MAT-162', 'KOSTIK SODA', 'Chemical', 'Kg', 0, 0),
('MAT-163', 'N-Hexana', 'Chemical', 'Pail', 2, 0),
('MAT-164', 'S-2002 Alkalinity Booster', 'Chemical', 'Kg', 25, 0),
('MAT-165', 'S-2101 Oxygen Scavenger', 'Chemical', 'Kg', 25, 0),
('MAT-166', 'S-2201 Scale Inhibitor', 'Chemical', 'Kg', 25, 0),
('MAT-167', 'SODA ASH', 'Chemical', 'Kg', 200, 1),
('MAT-168', 'SSO-1', 'Chemical', 'Botol', 1, 1),
('MAT-169', 'SSO-2', 'Chemical', 'Botol', 1, 1),
('MAT-170', 'SSO-3', 'Chemical', 'Botol', 1, 1),
('MAT-171', 'Valve Globe 1 inch PN 40', 'Sparepart Valve', 'Pcs', 2, 0),
('MAT-172', 'Valve Globe 2 inch PN 16', 'Sparepart Valve', 'Pcs', 2, 0),
('MAT-173', 'Valve Globe 3 inch PN 40', 'Sparepart Valve', 'Pcs', 2, 0),
('MAT-174', 'V-Belt B55', 'Sparepart', 'Pcs', 2, 0),
('MAT-175', 'V-Belt C-96 Bando', 'Sparepart', 'Pcs', 4, 0),
('MAT-176', 'V-Belt C-99 Bando', 'Sparepart', 'Pcs', 4, 0),
('MAT-177', 'V-Belt C-85 Bando', 'Sparepart', 'Pcs', 4, 14),
('MAT-178', 'V-Belt C-142 Bando', 'Sparepart', 'Pcs', 4, 3),
('MAT-179', 'V-Belt SPB 2240 Bando', 'Sparepart', 'Pcs', 4, 2),
('MAT-180', 'V-Belt B 66', 'Sparepart', 'Pcs', 4, 3),
('MAT-181', 'V-Belt B-57', 'Sparepart', 'Pcs', 4, 10),
('MAT-182', 'Packing Pintu Rebusan 1200mm x 7.5mm', 'Sparepart', 'Pcs', 4, 8),
('MAT-183', 'Packing Pintu Rebusan 1200mm x 9mm', 'Sparepart', 'Pcs', 4, 10),
('MAT-184', 'Gasked Chanel Solicone Sintetic RED', 'Sparepart', 'Pcs', 4, 4),
('MAT-185', 'Gland Packing', 'Sparepart', 'Meter', 4, 0),
('MAT-186', 'Gland Packing GALON 1 inch', 'Sparepart', 'Meter', 4, 10),
('MAT-187', 'Gland Packing Teflon', 'Sparepart', 'Meter', 4, 0),
('MAT-188', 'Karet Vibrating Screen', 'Sparepart', 'Pcs', 4, 7)
) AS m(partNumber, namaMaterial, kategori, satuan, minStock, stockOnHand)
WHERE c.code = 'PT-PKS' AND k.name = m.kategori AND k."companyId" = c.id AND s.name = m.satuan AND s."companyId" = c.id;

-- =====================================================
-- Verifikasi hasil insert
-- =====================================================
SELECT 'KategoriMaterial' as table_name, COUNT(*) as total FROM "KategoriMaterial" WHERE "companyId" = (SELECT id FROM "Company" WHERE code = 'PT-PKS')
UNION ALL
SELECT 'SatuanMaterial', COUNT(*) FROM "SatuanMaterial" WHERE "companyId" = (SELECT id FROM "Company" WHERE code = 'PT-PKS')
UNION ALL
SELECT 'MaterialInventaris', COUNT(*) FROM "MaterialInventaris" WHERE "companyId" = (SELECT id FROM "Company" WHERE code = 'PT-PKS');

