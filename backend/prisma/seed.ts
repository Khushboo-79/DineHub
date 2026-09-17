import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Common hashed password for test accounts: "Password@123"
  const password = await bcrypt.hash('Password@123', 10);

  // 1. Admin User
  const adminUser = await prisma.user.upsert({
    where: { mobileNumber: '9999999999' },
    update: {},
    create: {
      mobileNumber: '9999999999',
      email: 'admin@dinehub.com',
      password,
      ownerName: 'Admin Boss',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user created/verified:', adminUser.email);

  // 2. Restaurant Owner 1: Royal Feast
  const owner1 = await prisma.user.upsert({
    where: { mobileNumber: '9876543210' },
    update: {},
    create: {
      mobileNumber: '9876543210',
      email: 'rohit@royalfeast.com',
      password,
      ownerName: 'Rohit Sharma',
      role: Role.MANAGER,
      restaurant: {
        create: {
          name: 'Royal Feast Restaurant & Bar',
          phone: '+91 9876543210',
          email: 'contact@royalfeast.com',
          address: '101 MG Road, Connaught Place, New Delhi',
          isOnboarded: true,
          outlets: {
            create: [
              {
                name: 'Royal Feast - Connaught Place (Main Outlet)',
                openingTime: '11:00 AM',
                closingTime: '11:30 PM',
                services: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'],
                cuisines: ['North Indian', 'Mughlai', 'Tandoori', 'Biryani'],
                hasGST: true,
                gstin: '07AAAAA0000A1Z5',
                fssaiNumber: '13322001000123',
                serviceCharge: 5.0,
                invoicePrefix: 'RFCP-',
              },
              {
                name: 'Royal Feast Express - Cyber Hub Gurgaon',
                openingTime: '12:00 PM',
                closingTime: '12:00 AM',
                services: ['DINE_IN', 'TAKEAWAY'],
                cuisines: ['North Indian', 'Street Food'],
                hasGST: true,
                gstin: '06AAAAA0000A1Z2',
                fssaiNumber: '10822005000456',
                serviceCharge: 7.5,
                invoicePrefix: 'RFCY-',
              },
            ],
          },
        },
      },
    },
  });
  console.log('✅ Restaurant 1 created/verified:', owner1.ownerName);

  // 3. Restaurant Owner 2: Urban Crust Pizzeria
  const owner2 = await prisma.user.upsert({
    where: { mobileNumber: '9123456780' },
    update: {},
    create: {
      mobileNumber: '9123456780',
      email: 'priya@urbancrust.in',
      password,
      ownerName: 'Priya Verma',
      role: Role.MANAGER,
      restaurant: {
        create: {
          name: 'Urban Crust Artisanal Pizza & Cafe',
          phone: '+91 9123456780',
          email: 'hello@urbancrust.in',
          address: '42 Indiranagar 100ft Road, Bengaluru',
          isOnboarded: true,
          outlets: {
            create: [
              {
                name: 'Urban Crust - Indiranagar Flagship',
                openingTime: '10:00 AM',
                closingTime: '11:00 PM',
                services: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'],
                cuisines: ['Italian', 'Artisanal Pizza', 'Pasta', 'Beverages'],
                hasGST: true,
                gstin: '29BBBBB1111B1Z9',
                fssaiNumber: '11223002000789',
                serviceCharge: 5.0,
                invoicePrefix: 'UCIN-',
              },
            ],
          },
        },
      },
    },
  });
  console.log('✅ Restaurant 2 created/verified:', owner2.ownerName);

  console.log('🎉 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
