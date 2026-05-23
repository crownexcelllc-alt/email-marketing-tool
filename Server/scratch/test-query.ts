import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ContactsService } from '../src/modules/contacts/contacts.service';
import { ListContactsDto } from '../src/modules/contacts/dto/list-contacts.dto';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const contactsService = app.get(ContactsService);

  const authUser = {
    sub: '6a0ef11b478e0af81d29da64',
    userId: '6a0ef11b478e0af81d29da64',
    email: 'admin@test.com',
    workspaceId: '6a0ef1d2478e0af81d29da6f', // Optimum's Workspace
    role: 'owner' as any
  };

  console.log('Querying categories summary...');
  const summary = await contactsService.getCategorySummary(authUser);
  console.log('Category Summary:', JSON.stringify(summary, null, 2));

  const runQuery = async (categoryName: string) => {
    const dto: ListContactsDto = {
      page: 1,
      limit: 10,
      category: categoryName
    };
    console.log(`\nQuerying contacts for category: "${categoryName}"`);
    const result = await contactsService.findAll(dto, authUser);
    console.log(`Total found for "${categoryName}":`, result.pagination.total);
    console.log(`Items returned:`, result.items.length);
    if (result.items.length > 0) {
      console.log('Sample item category:', result.items[0].category);
    }
  };

  await runQuery('Eid Special');
  await runQuery('eid special');

  await app.close();
}

run().catch(console.error);
