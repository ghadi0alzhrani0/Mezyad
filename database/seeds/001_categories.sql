INSERT INTO categories(name) VALUES
 ('Camels'),('Real Estate'),('Luxury Handbags'),('Vehicle Plates'),('Rare Vehicles')
ON CONFLICT(name) DO NOTHING;
