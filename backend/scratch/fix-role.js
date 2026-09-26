import { PrismaClient } from '../node_modules/@prisma/client/auth/index.js';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.AUTH_DATABASE_URL || 'postgresql://admin:password@localhost:5432/dinehub_auth?schema=public'
    }
  }
});

async function main() {
  const users = await prisma.user.updateMany({
    where: { role: 'MANAGER' },
    data: { role: 'OWNER' }
  });
  console.log(`Updated ${users.count} users to OWNER role.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
