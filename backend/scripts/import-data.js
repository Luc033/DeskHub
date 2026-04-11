const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Iniciando a refatoração e importação dos dados para o DeskHub 3.0...');

  // O seu ID de usuário que você forneceu no SQL
  const MY_USER_ID = '42ee2f6b-0b40-4a9e-ac3c-263b5b32d766';

  // 1. Lendo o backup antigo
  const backupPath = path.join(__dirname, 'deskhub_backup.json');
  if (!fs.existsSync(backupPath)) {
    throw new Error('❌ Arquivo deskhub_backup.json não encontrado na pasta do backend!');
  }
  
  const rawData = fs.readFileSync(backupPath, 'utf-8');
  const backup = JSON.parse(rawData);

  console.log(`👤 Vinculando dados ao usuário ID: ${MY_USER_ID}`);

  // 2. Função inteligente para tratar Categorias
  // Ela busca se a categoria já existe. Se não existir, ela cria automaticamente!
  async function getOrCreateCategory(topicName) {
    if (!topicName) return 'Geral';
    
    const nameToSearch = topicName.trim();

    // Busca ignorando maiúsculas/minúsculas (ex: "NF-E" acha "NF-e")
    let category = await prisma.category.findFirst({
      where: { 
        name: { equals: nameToSearch, mode: 'insensitive' },
        userId: MY_USER_ID 
      }
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: nameToSearch, userId: MY_USER_ID }
      });
      console.log(`📁 Nova Categoria criada no banco: ${category.name}`);
    }
    
    return category.name; // Retorna o nome formatado corretamente conforme o banco
  }

  // 3. Importar Mensagens
  if (backup.messages && backup.messages.length > 0) {
    console.log(`\n📦 Processando ${backup.messages.length} mensagens...`);
    let importedMsgs = 0;
    
    for (const m of backup.messages) {
      // Passa o tópico antigo pela peneira de categorias
      const validTopicName = await getOrCreateCategory(m.topic);

      await prisma.message.create({
        data: {
          topic: validTopicName, // Mantemos topic como String conforme seu Prisma Schema atual
          title: m.title,
          content: m.content,
          command: null, // Novo formato aceitando nulo
          userId: MY_USER_ID
        }
      });
      importedMsgs++;
    }
    console.log(`✅ ${importedMsgs} Mensagens importadas e vinculadas às categorias!`);
  }

  // 4. Importar Links
  if (backup.links && backup.links.length > 0) {
    const linksData = backup.links.map(l => ({
      title: l.title,
      url: l.url,
      command: null,
      userId: MY_USER_ID
    }));
    const res = await prisma.link.createMany({ data: linksData });
    console.log(`✅ ${res.count} Links importados.`);
  }

  // 5. Importar Rotas (Shortcuts)
  if (backup.shortcuts && backup.shortcuts.length > 0) {
    const shortcutsData = backup.shortcuts.map(s => ({
      title: s.title,
      content: s.content,
      command: null,
      userId: MY_USER_ID
    }));
    const res = await prisma.shortcut.createMany({ data: shortcutsData });
    console.log(`✅ ${res.count} Rotas importadas.`);
  }

  // 6. Importar Emojis
  if (backup.emojis && backup.emojis.length > 0) {
    const emojisData = backup.emojis.map(e => ({
      name: e.name,
      value: e.value,
      command: null,
      userId: MY_USER_ID
    }));
    const res = await prisma.emoji.createMany({ data: emojisData });
    console.log(`✅ ${res.count} Emojis importados.`);
  }

  console.log('\n🎉 Todos os dados foram refatorados e importados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });