const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Iniciando a leitura do backup...');

  // 1. Lê o arquivo JSON
  const backupPath = path.join(__dirname, 'deskhub_backup.json');
  if (!fs.existsSync(backupPath)) {
    throw new Error('❌ Arquivo deskhub_backup.json não encontrado na pasta do backend!');
  }
  
  const rawData = fs.readFileSync(backupPath, 'utf-8');
  const backup = JSON.parse(rawData);

  // 2. Localiza o usuário Administrador para ser o "dono" dos dados
  const adminUser = await prisma.user.findFirst({
    where: { role: 'admin' },
    orderBy: { createdAt: 'asc' }
  });

  if (!adminUser) {
    throw new Error('❌ Nenhum usuário Administrador encontrado. Crie um admin primeiro.');
  }

  const userId = adminUser.id;
  console.log(`👤 Vinculando dados ao usuário: ${adminUser.name} (${adminUser.email})`);

  // 3. Importar Mensagens
  if (backup.messages && backup.messages.length > 0) {
    const messagesData = backup.messages.map(m => ({
      topic: m.topic,
      title: m.title,
      content: m.content,
      userId: userId // Vincula ao usuário
      // O campo 'command' ficará nulo automaticamente
    }));
    const res = await prisma.message.createMany({ data: messagesData });
    console.log(`✅ ${res.count} Mensagens importadas.`);
  }

  // 4. Importar Links
  if (backup.links && backup.links.length > 0) {
    const linksData = backup.links.map(l => ({
      title: l.title,
      url: l.url,
      userId: userId
    }));
    const res = await prisma.link.createMany({ data: linksData });
    console.log(`✅ ${res.count} Links importados.`);
  }

  // 5. Importar Rotas (Shortcuts)
  if (backup.shortcuts && backup.shortcuts.length > 0) {
    const shortcutsData = backup.shortcuts.map(s => ({
      title: s.title,
      content: s.content,
      userId: userId
    }));
    const res = await prisma.shortcut.createMany({ data: shortcutsData });
    console.log(`✅ ${res.count} Rotas importadas.`);
  }

  // 6. Importar Emojis
  if (backup.emojis && backup.emojis.length > 0) {
    const emojisData = backup.emojis.map(e => ({
      name: e.name,
      value: e.value,
      userId: userId
    }));
    const res = await prisma.emoji.createMany({ data: emojisData });
    console.log(`✅ ${res.count} Emojis importados.`);
  }

  console.log('\n🎉 Importação finalizada com sucesso! Seus dados estão prontos para o DeskHub 3.0.');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });