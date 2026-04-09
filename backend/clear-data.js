const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Iniciando a limpeza do banco de dados...');

  try {
    // Deleta os dados de cada tabela usando o Prisma
    const deletedAttendances = await prisma.attendance.deleteMany({});
    console.log(`✅ Atendimentos apagados: ${deletedAttendances.count}`);

    const deletedKpis = await prisma.dailyKpi.deleteMany({});
    console.log(`✅ KPIs apagados: ${deletedKpis.count}`);

    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`✅ Mensagens apagadas: ${deletedMessages.count}`);

    const deletedShortcuts = await prisma.shortcut.deleteMany({});
    console.log(`✅ Rotas apagadas: ${deletedShortcuts.count}`);

    const deletedLinks = await prisma.link.deleteMany({});
    console.log(`✅ Links apagados: ${deletedLinks.count}`);

    const deletedEmojis = await prisma.emoji.deleteMany({});
    console.log(`✅ Emojis apagados: ${deletedEmojis.count}`);

    const deletedNotes = await prisma.note.deleteMany({});
    console.log(`✅ Anotações apagadas: ${deletedNotes.count}`);

    const deletedAlerts = await prisma.alert.deleteMany({});
    console.log(`✅ Recados apagados: ${deletedAlerts.count}`);

    console.log('\n🎉 Limpeza concluída com sucesso!');
    console.log('Os Usuários e as Configurações do Sistema/IA foram mantidos intactos.');

  } catch (error) {
    console.error('\n❌ Ocorreu um erro ao tentar limpar o banco de dados:');
    console.error(error);
  }
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    // Desconecta do banco ao finalizar
    await prisma.$disconnect();
  });