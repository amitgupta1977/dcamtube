const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  await prisma.video.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});

  const hash = await bcrypt.hash('123456.987', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@dcamtube.com',
      passwordHash: hash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerified: true,
      country: 'IND',
      city: 'Mumbai',
      points: 0,
      coins: 0,
    }
  });

  const gov = await prisma.user.create({
    data: {
      email: 'gov@dcamtube.com',
      passwordHash: hash,
      firstName: 'Gov',
      lastName: 'User',
      role: 'GOVERNMENT',
      emailVerified: true,
      country: 'IND',
      city: 'New Delhi',
      points: 0,
      coins: 0,
    }
  });

  const normal = await prisma.user.create({
    data: {
      email: 'user@dcamtube.com',
      passwordHash: hash,
      firstName: 'Test',
      lastName: 'User',
      role: 'NORMAL',
      emailVerified: true,
      country: 'IND',
      city: 'Mumbai',
      points: 0,
      coins: 0,
    }
  });

  console.log('Seeded', { admin: admin.email, gov: gov.email, normal: normal.email });
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
