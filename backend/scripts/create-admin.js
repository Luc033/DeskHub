const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Criando usuário administrador...');
  const password = '+_*4Uzs[';

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@deskhub.com.br' },
    update: {
      password: hashedPassword,
      role: 'admin'
    },
    create: {
      name: 'Mestre DeskHub',
      email: 'admin@deskhub.com.br',
      password: hashedPassword,
      role: 'admin'
    }
  });

  console.log('✅ Administrador criado com sucesso!');
  console.log(`➡️ E-mail: ${admin.email}`);
  console.log(`➡️ Senha: password`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar admin:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });