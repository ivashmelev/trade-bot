import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Функция инициализирует в БД данные
 */
async function main() {
  await prisma.user.createMany({
    data: [
      {
        telegramId: 379132550,
        name: 'Иван',
      },
      {
        telegramId: 472445131,
        name: 'Сергей',
      },
    ],
  });
}

main()
  .catch((error) => {
    console.log(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
