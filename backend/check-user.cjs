const { PrismaClient } = require('@prisma/client/auth');
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://root:password@localhost:5438/dinehub_auth?schema=public" } } });

async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ id: u.id, mobileNumber: u.mobileNumber, hasPassword: !!u.password })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
