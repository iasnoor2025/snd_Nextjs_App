import { prisma } from '@/lib/db';
import { saudiCities } from './saudi-cities';

async function seedSaudiCities() {
  console.log('🌍 Starting Saudi Arabian cities seeding...');

  try {
    let citiesCreated = 0;
    let citiesSkipped = 0;
    let citiesUpdated = 0;

    for (const cityData of saudiCities) {
      try {
        const existingLocation = await prisma.location.findFirst({
          where: {
            name: cityData.name,
            city: cityData.city,
            state: cityData.state
          }
        });

        if (existingLocation) {
          // Update existing location with latest data
          await prisma.location.update({
            where: { id: existingLocation.id },
            data: {
              description: cityData.description,
              latitude: cityData.latitude,
              longitude: cityData.longitude,
              is_active: true,
            }
          });
          console.log(`🔄 Updated existing city: ${cityData.name}`);
          citiesUpdated++;
        } else {
          // Create new location
          await prisma.location.create({
            data: {
              name: cityData.name,
              description: cityData.description,
              city: cityData.city,
              state: cityData.state,
              country: cityData.country,
              latitude: cityData.latitude,
              longitude: cityData.longitude,
              is_active: true,
            }
          });
          console.log(`✅ Created new location: ${cityData.name}`);
          citiesCreated++;
        }
      } catch (error) {
        console.error(`❌ Error processing city ${cityData.name}:`, error);
      }
    }

    console.log(`\n📊 Saudi Cities Seeding Summary:`);
    console.log(`- Created: ${citiesCreated} new cities`);
    console.log(`- Updated: ${citiesUpdated} existing cities`);
    console.log(`- Total processed: ${citiesCreated + citiesUpdated} cities`);
    console.log(`- Total cities in data: ${saudiCities.length}`);

    console.log('\n🌍 Saudi Arabian cities seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during Saudi cities seeding:', error);
    throw error;
  }
}

seedSaudiCities()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
