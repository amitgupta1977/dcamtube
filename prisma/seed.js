const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  await prisma.video.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});

  // Never commit a real password. Set SEED_PASSWORD when you run the seed.
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error('Set SEED_PASSWORD (at least 12 characters) before running the seed.');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The seed deletes all users and videos. Refusing to run in production.');
  }
  const hash = await bcrypt.hash(seedPassword, 12);

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
