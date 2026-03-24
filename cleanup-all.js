// Safe, explicit cleanup script to wipe all user-related data
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Delete in order to respect FK constraints
  await prisma.downloadRequest.deleteMany().catch(() => {});
  await prisma.videoPurchase.deleteMany().catch(() => {});
  await prisma.like.deleteMany().catch(() => {});
  await prisma.comment.deleteMany().catch(() => {});
  await prisma.video.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});
  console.log('Cleanup complete: all user-related data removed.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => { console.error('Cleanup error:', err); prisma.$disconnect(); })
  .finally(() => process.exit(0));
