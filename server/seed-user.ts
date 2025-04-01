import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedUsers() {
  try {
    // Update admin password
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db
      .update(users)
      .set({ password: adminPassword })
      .where(eq(users.username, 'admin'));
    console.log('Admin user password updated');
    
    // Update owner password
    const ownerPassword = await bcrypt.hash('owner123', 10);
    await db
      .update(users)
      .set({ password: ownerPassword })
      .where(eq(users.username, 'owner'));
    console.log('Owner user password updated');
    
    // Update technician password
    const techPassword = await bcrypt.hash('tech123', 10);
    await db
      .update(users)
      .set({ password: techPassword })
      .where(eq(users.username, 'technician'));
    console.log('Technician user password updated');
    
    console.log('All user passwords updated successfully!');
  } catch (error) {
    console.error('Error updating user passwords:', error);
  }
}

seedUsers().then(() => {
  console.log('Password seeding complete');
  process.exit(0);
}).catch(error => {
  console.error('Password seeding failed:', error);
  process.exit(1);
});