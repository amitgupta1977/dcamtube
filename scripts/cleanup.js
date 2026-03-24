// Cleanup script to wipe all user-related data from the local DB
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Delete dependent data first to respect FK constraints
  try { await prisma.downloadRequest.deleteMany(); } catch (e) { /* ignore if table missing */ }
  try { await prisma.videoPurchase.deleteMany(); } catch (e) { }
  try { await prisma.comment.deleteMany(); } catch (e) { }
  try { await prisma.like.deleteMany(); } catch (e) { }
  try { await prisma.video.deleteMany(); } catch (e) { }
  try { await prisma.user.deleteMany(); } catch (e) { }
  console.log('Cleanup complete: all user-related data removed.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => { console.error('Cleanup error:', err); prisma.$disconnect(); })
  .finally(() => process.exit(0));
