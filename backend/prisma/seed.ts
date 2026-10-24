import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();
const PASSWORD = 'password123';

const users = [
  { name: 'Nick Fury', email: 'nick.fury@slooze.xyz', role: 'ADMIN', country: 'AMERICA' }, // admin is org-wide; country is informational
  { name: 'Captain Marvel', email: 'captain.marvel@slooze.xyz', role: 'MANAGER', country: 'INDIA' },
  { name: 'Captain America', email: 'captain.america@slooze.xyz', role: 'MANAGER', country: 'AMERICA' },
  { name: 'Thanos', email: 'thanos@slooze.xyz', role: 'MEMBER', country: 'INDIA' },
  { name: 'Thor', email: 'thor@slooze.xyz', role: 'MEMBER', country: 'INDIA' },
  { name: 'Travis', email: 'travis@slooze.xyz', role: 'MEMBER', country: 'AMERICA' },
];

const restaurants = [
  { name: 'Spice Route', cuisine: 'North Indian', country: 'INDIA', items: [
    ['Butter Chicken', 'Slow-cooked tomato and cream gravy', 420], ['Paneer Tikka', 'Charred in the tandoor', 320],
    ['Garlic Naan', 'Two pieces, brushed with butter', 90], ['Dal Makhani', 'Overnight black lentils', 280] ] },
  { name: 'Dosa Junction', cuisine: 'South Indian', country: 'INDIA', items: [
    ['Masala Dosa', 'Crisp rice crepe, potato filling', 160], ['Idli Sambar', 'Four steamed idlis', 120],
    ['Medu Vada', 'Fried lentil doughnuts', 110], ['Filter Coffee', 'Decoction and hot milk', 60] ] },
  { name: 'Liberty Burger Co.', cuisine: 'American Grill', country: 'AMERICA', items: [
    ['Classic Cheeseburger', 'Smash patty, American cheese', 11.5], ['Bacon BBQ Burger', 'Applewood bacon, onion ring', 13.5],
    ['Loaded Fries', 'Cheese sauce and scallions', 7], ['Vanilla Shake', 'Hand-spun', 6] ] },
  { name: 'Brooklyn Slice', cuisine: 'New York Pizza', country: 'AMERICA', items: [
    ['Cheese Slice', 'Foldable, as intended', 3.5], ['Pepperoni Pie', '16-inch whole pie', 22],
    ['Garlic Knots', 'Six knots with marinara', 6], ['Caesar Salad', 'Romaine, parmesan, croutons', 9] ] },
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.user.deleteMany();

  for (const u of users) await prisma.user.create({ data: { ...u, password: hashSync(PASSWORD, 10) } });
  for (const r of restaurants) {
    await prisma.restaurant.create({
      data: {
        name: r.name, cuisine: r.cuisine, country: r.country,
        menuItems: { create: r.items.map(([name, description, price]) => ({ name: name as string, description: description as string, price: price as number })) },
      },
    });
  }
  await prisma.paymentMethod.createMany({ data: [
    { type: 'CARD', label: 'Visa', last4: '4242', isDefault: true },
    { type: 'UPI', label: 'UPI', last4: '' },
    { type: 'PAYPAL', label: 'PayPal Business', last4: '' },
  ] });
  console.log(`Seeded ${users.length} users, ${restaurants.length} restaurants. Password for all: ${PASSWORD}`);
}

main().finally(() => prisma.$disconnect());
