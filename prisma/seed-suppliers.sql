-- =====================================================
-- SQL INSERT Query untuk Supplier PT-PKS
-- Jalankan di pgAdmin menggunakan Query Tool
-- Generated: 2026-01-15
-- =====================================================

-- Pastikan Anda menjalankan query ini setelah company PT-PKS sudah ada di database

-- =====================================================
-- 1. ANUGRAH MANDIRI (AM)
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'AIDIL FITRA / BUYUNG',
    'SIMPANG LANGGAM, DUSUN BOBOKO, DESA LUBUK OGUNG, KEC. BANDAR SEI KIJANG, KAB. PELALAWAN, RIAU',
    '0822 8468 0008',
    'ANUGRAH MANDIRI (AM)',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "AIDIL FITRA", "accountNumber": "1080030989595", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 2. KUD TENERA JAYA
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'KUD',
    'ISTIAR',
    'Nakula, RT 001 RW 001, Banjar Panjang Kerumutan, Pelalawan, Riau',
    '+62 812 7796 6621',
    'KUD TENERA JAYA',
    '[]'::jsonb,
    0, 0,
    '74.040.540.2-222.0000',
    '[{"bankName": "BNI", "accountName": "KUD TENERA JAYA", "accountNumber": "1296244500", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 3. BMJ
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'MELKI SITORUS',
    'JL. KORIDOR RAPP KM 38',
    '0852 7208 6877',
    'BMJ',
    '[]'::jsonb,
    0, 0,
    '97.109.279.6-216.000',
    '[{"bankName": "BRI", "accountName": "MIKA LAWANTI HUTAGAL", "accountNumber": "740701010780536", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 4. MUKTAR NASUTION
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'MUKTAR NASUTION',
    'PERUMAHAN GRAND HAYATI BLOK B',
    '0822 2555 3330',
    'MUKTAR NASUTION',
    '[]'::jsonb,
    0, 0,
    '16.726.889.5-222.000',
    '[{"bankName": "BRI", "accountName": "MUKTAR NASUTION", "accountNumber": "062201001182560", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 5. BKT (Bersama Kita)
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'HAKIM SIHOMBING',
    'Buatan',
    '0812 7653 0041',
    'BKT (Bersama Kita)',
    '[]'::jsonb,
    0, 0,
    '097181044221000',
    '[{"bankName": "BRI", "accountName": "HERLINA SARAGI", "accountNumber": "069601003783563", "isDefault": true}, {"bankName": "MANDIRI", "accountName": "HERLINA SARAGI", "accountNumber": "1080031053961", "isDefault": false}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 6. SPSI BONGKAR MUAT (vendor Bongkar Muat)
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'SUARDI',
    'DESA LUBUK OGUNG',
    '085376036500',
    'SPSI BONGKAR MUAT',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "SUARDI", "accountNumber": "701401000937536", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 7. SERIKAT PEKERJA LUBUK OGUNG (SPLO) (vendor Bongkar Muat)
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'YUWONO TEGUH SANTOSO',
    'DESA LUBUK OGUNG',
    '0812 7771 9222',
    'SERIKAT PEKERJA LUBUK OGUNG (SPLO)',
    '[]'::jsonb,
    0, 0,
    '39.455.910.8-222.000',
    '[{"bankName": "BRK SYARIAH", "accountName": "SERIKAT PEKERJA LUBUK OGUNG (SPLO)", "accountNumber": "1874300422", "isDefault": true}, {"bankName": "BRI", "accountName": "YUWONO TEGUH SANTOSO", "accountNumber": "701401001388536", "isDefault": false}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 8. KUD SABAR SUBUR
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'KUD',
    'ESWADI',
    'BAKTI MULYA',
    '0812 9711 3004',
    'KUD SABAR SUBUR',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BNI", "accountName": "KUD SABAR SUBUR", "accountNumber": "831579558", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 9. PT. PEMASOK MITRA PEMBELI (PEM-PEM)
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'DANIEL H SIREGAR',
    'JL. PASUNDAN, PERUMAHAN PASUNDAN PERMAI BLOK E',
    '0889 9526 1703',
    'PT. PEMASOK MITRA PEMBELI (PEM-PEM)',
    '[]'::jsonb,
    0, 0,
    '94.943.575.4-741.000',
    '[{"bankName": "BRI", "accountName": "PEMASOK MITRA PEMBELI", "accountNumber": "44801000631308", "isDefault": true}]'::jsonb,
    false, false, true, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 10. YOSE
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'YOGI SETIAWAN',
    'SIMPANG KUALO, PKL. KERNCI KOTA, KEC. PANGKALAN KERINCI, PELALAWAN, RIAU',
    '085364269393',
    'YOSE',
    '[]'::jsonb,
    0, 0,
    '58.036.770.4-222.000',
    '[{"bankName": "BRI", "accountName": "YOGI SETIAWAN", "accountNumber": "062201001187560", "isDefault": true}, {"bankName": "BRI", "accountName": "LOUSE CHINTIA YUSUF", "accountNumber": "062201001179567", "isDefault": false}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 11. Pratama Razka Jaya (PRAJA)
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'Pratama Razka Jaya',
    'PANGKALAN KERINCI',
    '081371381558',
    'Pratama Razka Jaya (PRAJA)',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "PRATAMA RAZKA JAYA", "accountNumber": "062201001364308", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 12. RAMADHAN
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'RAMADHAN',
    '-',
    '-',
    'RAMADHAN',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "RAMADHAN", "accountNumber": "743001004151508", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 13. FSG
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'FAJRI FALINTIO PUTRA',
    'Jl. Seminai Ujung, Gg. Nurul Huda RT 008 RW 005, Pkl. Kerinci Kota, Kec. Pkl. Kerinci, Kab. Pelalawan, Riau',
    '081324493221',
    'FSG',
    '[]'::jsonb,
    0, 0,
    '85.563.005.9-222.000',
    '[{"bankName": "MANDIRI", "accountName": "FAJRI FALINTIO PUTRA", "accountNumber": "1080030495890", "isDefault": true}, {"bankName": "BRI", "accountName": "FAJRI FALINTIO PUTRA", "accountNumber": "062201072134508", "isDefault": false}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 14. NABABAN
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'RIKSON PERNANDO',
    '-',
    '-',
    'NABABAN',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "RIKSON PERNANDO", "accountNumber": "775701013027532", "isDefault": true}, {"bankName": "MANDIRI", "accountName": "RIKSON PERNANDO", "accountNumber": "1080030842877", "isDefault": false}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 15. RG
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'JUNAIDI GINTING',
    '-',
    '-',
    'RG',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "JUNAIDI GINTING", "accountNumber": "1080555323337", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 16. RINA JAYA
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'SUDARNO',
    '-',
    '-',
    'RINA JAYA',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "SUDARNO", "accountNumber": "062201001264566", "isDefault": true}, {"bankName": "MANDIRI", "accountName": "RINA JAYA", "accountNumber": "1080003200798", "isDefault": false}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 17. MONALISA LUBIS
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'MONALISA LUBIS',
    '-',
    '-',
    'MONALISA LUBIS',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "MONALISA LUBIS", "accountNumber": "1080090099905", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 18. GM
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'RIKO RAMANDA',
    '-',
    '-',
    'GM',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "RIKO RAMANDA", "accountNumber": "701401014135532", "isDefault": true}, {"bankName": "MANDIRI", "accountName": "RIKO RAMANDA", "accountNumber": "1720006256996", "isDefault": false}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 19. PUTRA DAMANIK
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'EDI SAHPUTRA DAMANIK',
    '-',
    '-',
    'PUTRA DAMANIK',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "EDI SAHPUTRA DAMANIK", "accountNumber": "717601029076531", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 20. PT YOSE GIRO
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'YOGI SETIAWAN',
    '-',
    '-',
    'PT YOSE GIRO',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "PT YOSE GIRO", "accountNumber": "062201001702302", "isDefault": true}]'::jsonb,
    false, false, true, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 21. TJR
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'EDY FIMANTA BARUS',
    '-',
    '-',
    'TJR',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BCA", "accountName": "EDY FIMANTA BARUS", "accountNumber": "8430529341", "isDefault": true}, {"bankName": "BRI", "accountName": "DEWI RAHAYU GINTING", "accountNumber": "069601223322561", "isDefault": false}, {"bankName": "MANDIRI", "accountName": "EDY FIMANTA BARUS", "accountNumber": "1050022000107", "isDefault": false}, {"bankName": "BRI", "accountName": "CINDI OKTAVIA BR SEMBIRING", "accountNumber": "208701043339509", "isDefault": false}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 22. ROMANA
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'ELKA SUSANA BR.BANGU',
    '-',
    '-',
    'ROMANA',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "ELKA SUSANA BR.BANGU", "accountNumber": "1080570000050", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 23. EBENEZER
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'EBEN HAIZER GINTING',
    '-',
    '-',
    'EBENEZER',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "EBEN HAIZER GINTING", "accountNumber": "1080013461166", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 24. JP
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'RAFA''I',
    '-',
    '-',
    'JP',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "RAFA''I", "accountNumber": "701401022473534", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 25. ADZKIA LESUNG
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'HENDRA SAPUTRA',
    '-',
    '-',
    'ADZKIA LESUNG',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "HENDRA SAPUTRA", "accountNumber": "1080030666888", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 26. IRFAN
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'IRFAN MANSYUR',
    '-',
    '-',
    'IRFAN',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "IRFAN MANSYUR", "accountNumber": "1080064326433", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 27. ANTO TELAYAP
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'ERIC FU',
    '-',
    '-',
    'ANTO TELAYAP',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "ERIC FU", "accountNumber": "1080028918069", "isDefault": true}, {"bankName": "BRI", "accountName": "YETY", "accountNumber": "216101000008561", "isDefault": false}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 28. ABINAZER / HTG
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'ABIGAEL HELINDA',
    '-',
    '-',
    'ABINAZER / HTG',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "ABIGAEL HELINDA", "accountNumber": "1080030480660", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 29. DEBORA
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'IVO PANJAITAN',
    '-',
    '-',
    'DEBORA',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "IVO PANJAITAN", "accountNumber": "202601000337562", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 30. JOE
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'NOVA THERESIA',
    '-',
    '-',
    'JOE',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "NOVA THERESIA", "accountNumber": "177001002144509", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 31. TABRONI
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'TABRONI',
    '-',
    '-',
    'TABRONI',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "TABRONI", "accountNumber": "216101010558506", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 32. TAXI ONLINE
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'ANDI SAHPUTRA SINULINGGA',
    '-',
    '-',
    'TAXI ONLINE',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "ANDI SAHPUTRA SINULINGGA", "accountNumber": "1080021297131", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 33. MAJ
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'M. IHSAN',
    '-',
    '-',
    'MAJ',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "M. IHSAN", "accountNumber": "1080013031282", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 34. PASARIBU
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'ALESSANDRIO PASARIBU',
    '-',
    '-',
    'PASARIBU',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "ALESSANDRIO PASARIBU", "accountNumber": "740701007886533", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 35. LBS
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'SUPIANI',
    '-',
    '-',
    'LBS',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "SUPIANI", "accountNumber": "1080026344367", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 36. AZRIL
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'YONGKI CAHYO PRABOWO',
    '-',
    '-',
    'AZRIL',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "YONGKI CAHYO PRABOWO", "accountNumber": "1080029002426", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 37. PAHALA EFENDI PANDIANGAN
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'PAHALA EFENDI PANDIANGAN',
    '-',
    '-',
    'PAHALA EFENDI PANDIANGAN',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "PAHALA EFENDI PANDIANGAN", "accountNumber": "202601001728504", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 38. JUFRI
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'JUFRI',
    '-',
    '-',
    'JUFRI',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "JUFRI", "accountNumber": "1080017495111", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 39. NAGA
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'PARMAN SINAGA',
    '-',
    '-',
    'NAGA',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "PARMAN SINAGA", "accountNumber": "1080023446900", "isDefault": true}, {"bankName": "BRI", "accountName": "MURNIATI SILALAHI", "accountNumber": "336101044630535", "isDefault": false}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 40. JULIUS IMMANUEL PANDIANGAN
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'JULIUS IMMANUEL PANDIANGAN',
    '-',
    '-',
    'JULIUS IMMANUEL PANDIANGAN',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "MANDIRI", "accountName": "JULIUS IMMANUEL PANDIANGAN", "accountNumber": "1080014060918", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 41. KKPA
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'KELOMPOK_TANI',
    'SAIMAN',
    '-',
    '-',
    'KKPA',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "SAIMAN", "accountNumber": "743001001361536", "isDefault": true}]'::jsonb,
    false, true, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 42. AFD 6 MULYADI
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'IRAWATI',
    '-',
    '-',
    'AFD 6 MULYADI',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "IRAWATI", "accountNumber": "717601015602536", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 43. AFD 6 JUMADI
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'MULIYANI',
    '-',
    '-',
    'AFD 6 JUMADI',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "MULIYANI", "accountNumber": "717601000321501", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- 44. WINER
-- =====================================================
INSERT INTO "Supplier" (
    "id", "companyId", "type", "ownerName", "address", "personalPhone", "companyName",
    "gardenProfiles", "longitude", "latitude", "npwp", "bankAccounts",
    "swadaya", "kelompok", "perusahaan", "certificationISPO", "certificationRSPO",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    (SELECT id FROM "Company" WHERE code = 'PT-PKS'),
    'RAMP_PERON',
    'YATAFATI ZEBUA',
    '-',
    '-',
    'WINER',
    '[]'::jsonb,
    0, 0,
    NULL,
    '[{"bankName": "BRI", "accountName": "YATAFATI ZEBUA", "accountNumber": "701401006746535", "isDefault": true}]'::jsonb,
    false, false, false, false, false,
    NOW(), NOW()
);

-- =====================================================
-- Verifikasi hasil insert
-- =====================================================
SELECT COUNT(*) as total_inserted FROM "Supplier" WHERE "companyId" = (SELECT id FROM "Company" WHERE code = 'PT-PKS');
