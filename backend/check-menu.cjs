const { PrismaClient } = require('@prisma/client/menu');
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://root:password@localhost:5436/dinehub_menu?schema=public" } } });

async function main() {
  const items = await prisma.menuItem.findMany();
  console.log('Menu Items:', items.map(i => ({ id: i.id, name: i.name, ownerId: i.ownerId })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
