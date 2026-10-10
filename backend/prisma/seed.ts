import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ============================================
  // PASSWORDS
  // ============================================

  const password = "Password123!";

  const passwordHash = await bcrypt.hash(password, 12);

  // ============================================
  // USERS
  // ============================================

  const supervisor = await prisma.user.upsert({
    where: {
      email: "supervisor@apparelflow.com",
    },
    update: {},
    create: {
      email: "supervisor@apparelflow.com",
      passwordHash,
      fullName: "Cutting Supervisor",
      role: UserRole.CUTTING_SUPERVISOR,
    },
  });

  const verifier = await prisma.user.upsert({
    where: {
      email: "verifier@apparelflow.com",
    },
    update: {},
    create: {
      email: "verifier@apparelflow.com",
      passwordHash,
      fullName: "Cutting Verifier",
      role: UserRole.CUTTING_VERIFIER,
    },
  });

  const sewingSupervisor = await prisma.user.upsert({
    where: {
      email: "sewing@apparelflow.com",
    },
    update: {},
    create: {
      email: "sewing@apparelflow.com",
      passwordHash,
      fullName: "Sewing Supervisor",
      role: UserRole.SEWING_SUPERVISOR,
    },
  });

  console.log("✅ Users created");

  // ============================================
  // CASUAL BLOUSE
  // ============================================

  const casualBlouse = await prisma.recipe.upsert({
    where: {
      recipeCode: "REC-BL01",
    },
    update: {},
    create: {
      recipeCode: "REC-BL01",
      name: "Casual Blouse",
      category: "Blouse",
      stdFabricYards: 1.8,
      wastageCap: 5.0,

      components: {
        create: [
          {
            componentName: "Front Body Panel",
            piecesPerGarment: 1,
          },
          {
            componentName: "Back Body Panel",
            piecesPerGarment: 1,
          },
          {
            componentName: "Sleeves (Left & Right)",
            piecesPerGarment: 2,
          },
          {
            componentName: "Collar & Stand",
            piecesPerGarment: 1,
          },
          {
            componentName: "Sleeve Cuffs",
            piecesPerGarment: 2,
          },
        ],
      },
    },
    include: {
      components: true,
    },
  });

  console.log(
    `✅ ${casualBlouse.name} created with ${casualBlouse.components.length} components`,
  );

  // ============================================
  // CROP TOP
  // ============================================

  const cropTop = await prisma.recipe.upsert({
    where: {
      recipeCode: "REC-CT02",
    },
    update: {},
    create: {
      recipeCode: "REC-CT02",
      name: "Crop Top",
      category: "Crop Top",
      stdFabricYards: 1.1,
      wastageCap: 8.0,

      components: {
        create: [
          {
            componentName: "Front Chest Panel",
            piecesPerGarment: 1,
          },
          {
            componentName: "Back Support Panel",
            piecesPerGarment: 1,
          },
          {
            componentName: "Neck Binding Strip",
            piecesPerGarment: 1,
          },
          {
            componentName: "Hem Elastic Casing",
            piecesPerGarment: 1,
          },
          {
            componentName: "Side Strap Accents",
            piecesPerGarment: 2,
          },
        ],
      },
    },
    include: {
      components: true,
    },
  });

  console.log(
    `✅ ${cropTop.name} created with ${cropTop.components.length} components`,
  );

  // ============================================
  // SUMMARY
  // ============================================

  console.log("\n🎉 Database seed completed successfully!");

  console.log("\nDemo Accounts:");
  console.log("----------------------------------------");
  console.log("Cutting Supervisor:");
  console.log("Email: supervisor@apparelflow.com");
  console.log("Password: Password123!");

  console.log("\nCutting Verifier:");
  console.log("Email: verifier@apparelflow.com");
  console.log("Password: Password123!");

  console.log("\nSewing Supervisor:");
  console.log("Email: sewing@apparelflow.com");
  console.log("Password: Password123!");

  console.log("----------------------------------------");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
