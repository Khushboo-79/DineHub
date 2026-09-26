$env:RESTAURANT_DATABASE_URL="postgresql://root:password@localhost:5433/dinehub_restaurant?schema=public"; npx prisma db push --schema=apps/restaurant-service/prisma/schema.prisma
$env:MENU_DATABASE_URL="postgresql://root:password@localhost:5434/dinehub_menu?schema=public"; npx prisma db push --schema=apps/menu-service/prisma/schema.prisma
$env:INVENTORY_DATABASE_URL="postgresql://root:password@localhost:5435/dinehub_inventory?schema=public"; npx prisma db push --schema=apps/inventory-service/prisma/schema.prisma
$env:ORDER_DATABASE_URL="postgresql://root:password@localhost:5436/dinehub_order?schema=public"; npx prisma db push --schema=apps/order-service/prisma/schema.prisma
$env:BILLING_DATABASE_URL="postgresql://root:password@localhost:5437/dinehub_billing?schema=public"; npx prisma db push --schema=apps/billing-service/prisma/schema.prisma
