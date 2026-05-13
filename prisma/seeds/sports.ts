import prisma from "@/lib/prisma";

const SPORTS = [
  'Soccer',
  'Basketball',
  'Volleyball',
  'Baseball',
  'Softball',
  'American Football',
  'Rugby',
  'Cricket',
  'Field Hockey',
  'Ice Hockey',
  'Water Polo',
  'Handball',
  'Lacrosse',
  'Futsal',
  'Doubles Tennis',
  'Doubles Badminton',
  'Doubles Pickleball',
  'Doubles Table Tennis',
  'Kabaddi',
  'Tug of War',
  'Rowing',
  'Dragon Boat Racing',
  'Curling',
  'Ultimate Frisbee',
]

export async function seedSports() {
  console.log("Seeding sports...");

  for (const name of SPORTS) {
    await prisma.sport.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    }

  console.log(`✅ Created ${SPORTS.length} products`);
  return SPORTS;
}
