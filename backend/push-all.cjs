const { execSync } = require('child_process');

const dbs = [
  { name: 'auth-service', port: 5438, db: 'dinehub_auth', env: 'AUTH_DATABASE_URL' },
  { name: 'restaurant-service', port: 5433, db: 'dinehub_restaurant', env: 'RESTAURANT_DATABASE_URL' },
  { name: 'menu-service', port: 5434, db: 'dinehub_menu', env: 'MENU_DATABASE_URL' },
  { name: 'inventory-service', port: 5435, db: 'dinehub_inventory', env: 'INVENTORY_DATABASE_URL' },
  { name: 'order-service', port: 5436, db: 'dinehub_order', env: 'ORDER_DATABASE_URL' },
  { name: 'billing-service', port: 5437, db: 'dinehub_billing', env: 'BILLING_DATABASE_URL' },
];

for (const db of dbs) {
  const url = `postgresql://root:password@localhost:${db.port}/${db.db}?schema=public`;
  console.log(`Pushing schema for ${db.name}...`);
  try {
    execSync(`npx prisma db push --schema apps/${db.name}/prisma/schema.prisma`, {
      env: { ...process.env, [db.env]: url },
      stdio: 'inherit'
    });
  } catch (err) {
    console.error(`Error pushing ${db.name}`);
  }
}
