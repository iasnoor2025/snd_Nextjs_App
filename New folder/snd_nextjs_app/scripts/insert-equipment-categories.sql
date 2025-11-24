-- Insert equipment categories
INSERT INTO equipment_categories (name, description, icon, color, is_active, created_at, updated_at) VALUES
('DOZER', 'Bulldozers and dozers for earth moving and grading', '🚜', '#FF6B6B', true, CURRENT_DATE, CURRENT_DATE),
('LOADER', 'Wheel loaders and front-end loaders', '🏗️', '#4ECDC4', true, CURRENT_DATE, CURRENT_DATE),
('TRUCK', 'Dump trucks, flatbed trucks, and transport vehicles', '🚛', '#45B7D1', true, CURRENT_DATE, CURRENT_DATE),
('WATER TANKER', 'Water tankers and water transport vehicles', '💧', '#96CEB4', true, CURRENT_DATE, CURRENT_DATE),
('ROLLER', 'Road rollers and compaction equipment', '⚙️', '#FFEAA7', true, CURRENT_DATE, CURRENT_DATE),
('GRADER', 'Motor graders for road construction', '🛣️', '#DDA0DD', true, CURRENT_DATE, CURRENT_DATE),
('EXCAVATOR', 'Excavators and digging equipment', '⛏️', '#FF8A80', true, CURRENT_DATE, CURRENT_DATE),
('CRANE', 'Cranes and lifting equipment', '🏗️', '#FFB74D', true, CURRENT_DATE, CURRENT_DATE),
('COMPACTOR', 'Soil compactors and compaction equipment', '🔨', '#81C784', true, CURRENT_DATE, CURRENT_DATE),
('FORKLIFT', 'Forklifts and material handling equipment', '📦', '#64B5F6', true, CURRENT_DATE, CURRENT_DATE),
('TRACTOR', 'Tractors and agricultural equipment', '🚜', '#A1887F', true, CURRENT_DATE, CURRENT_DATE),
('GENERATOR', 'Generators and power equipment', '⚡', '#FFD54F', true, CURRENT_DATE, CURRENT_DATE),
('COMPRESSOR', 'Air compressors and pneumatic equipment', '💨', '#7986CB', true, CURRENT_DATE, CURRENT_DATE),
('PUMP', 'Water pumps and pumping equipment', '🌊', '#4FC3F7', true, CURRENT_DATE, CURRENT_DATE),
('WELDER', 'Welding equipment and tools', '🔥', '#FF7043', true, CURRENT_DATE, CURRENT_DATE),
('OTHER', 'Other equipment types', '🔧', '#9E9E9E', true, CURRENT_DATE, CURRENT_DATE)
ON CONFLICT (name) DO NOTHING;
