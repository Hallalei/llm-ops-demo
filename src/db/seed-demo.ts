/**
 * Demo Seed Script
 * 生成 Demo 数据用于公开演示
 */
import { faker } from "@faker-js/faker";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { nanoid } from "nanoid";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

// Demo 数据配置
const DEMO_CONFIG = {
  USERS_COUNT: 2, // 管理员数量
  END_USERS_COUNT: 10, // 终端用户数量
  CONVERSATIONS_COUNT: 50, // 对话数量
  SESSIONS_COUNT: 15, // 会话数量
  DATASETS_COUNT: 2, // 数据集数量
};

// Demo Q&A 模板 - 太阳能/逆变器相关
const DEMO_QA_TEMPLATES = [
  {
    query: "How do I connect my inverter to WiFi?",
    response:
      "To connect your inverter to WiFi: 1) Open the Deye app on your phone, 2) Go to Settings > WiFi Configuration, 3) Select your home WiFi network, 4) Enter the password and wait for connection confirmation. The LED indicator will turn solid green when connected.",
  },
  {
    query: "What is the warranty period for solar panels?",
    response:
      "Our solar panels come with a comprehensive warranty: 25-year performance warranty (guaranteeing at least 80% output) and 10-year product warranty covering manufacturing defects. Please keep your purchase receipt for warranty claims.",
  },
  {
    query: "My system shows error code E01, what does it mean?",
    response:
      "Error code E01 indicates a grid voltage issue. This usually means: 1) Grid voltage is outside acceptable range, 2) There might be a loose connection. Please check your grid connection and contact your installer if the issue persists.",
  },
  {
    query: "How can I check my daily power generation?",
    response:
      "You can check your daily power generation through: 1) The Deye app dashboard shows real-time and historical data, 2) The inverter display panel shows current output, 3) Our web portal at portal.deye.com provides detailed analytics and reports.",
  },
  {
    query: "The app is not syncing data, how to fix?",
    response:
      "If your app is not syncing: 1) Check your internet connection, 2) Ensure the inverter WiFi indicator is green, 3) Try logging out and back into the app, 4) If issues persist, restart your inverter by turning it off for 30 seconds.",
  },
  {
    query: "What is the maximum capacity supported?",
    response:
      "Our inverters support various capacities: Single-phase models range from 3kW to 8kW, Three-phase models range from 5kW to 50kW. For larger installations, multiple inverters can be configured in parallel. Please consult with your installer for optimal configuration.",
  },
  {
    query: "How to set up monitoring for multiple sites?",
    response:
      "For multi-site monitoring: 1) Create a master account in the Deye Cloud portal, 2) Add each site as a sub-station, 3) Assign unique station IDs to each location, 4) Configure user permissions for each site. The dashboard will show aggregated data from all sites.",
  },
  {
    query: "Can I export my energy data to Excel?",
    response:
      "Yes, you can export your energy data: 1) Log into portal.deye.com, 2) Navigate to Reports section, 3) Select the date range and data type, 4) Click 'Export' and choose Excel format. The file will include daily generation, consumption, and grid export data.",
  },
  {
    query: "What maintenance does my solar system need?",
    response:
      "Regular maintenance includes: 1) Clean panels every 3-6 months (more often in dusty areas), 2) Check for shading from growing trees, 3) Inspect cables and connections annually, 4) Monitor system performance through the app for any anomalies. Professional inspection recommended every 2 years.",
  },
  {
    query: "How do I read the inverter display?",
    response:
      "The inverter display shows: Top line - Current power output (kW), Second line - Daily energy generated (kWh), Third line - Total lifetime generation (MWh), Status icons indicate WiFi connection, grid status, and any active alerts. Press the button to cycle through more details.",
  },
  {
    query: "Why is my power output lower than expected?",
    response:
      "Lower output can be caused by: 1) Weather conditions (clouds, rain), 2) Panel soiling or shading, 3) High ambient temperature reducing efficiency, 4) System degradation over time. Check our app analytics to compare with historical data and regional averages.",
  },
  {
    query: "How do I reset my system password?",
    response:
      "To reset your password: 1) Go to the login page, 2) Click 'Forgot Password', 3) Enter your registered email, 4) Check your inbox for the reset link (also check spam folder), 5) Create a new password with at least 8 characters including numbers and symbols.",
  },
  {
    query: "What happens during a power outage?",
    response:
      "During a grid outage: Standard grid-tied inverters will shut down for safety (anti-islanding protection). If you have a hybrid inverter with battery backup, it can switch to off-grid mode to power essential loads. The transition takes about 10-20 milliseconds.",
  },
  {
    query: "How do I add a new user to my account?",
    response:
      "To add a new user: 1) Log into the management portal, 2) Go to Settings > User Management, 3) Click 'Add User' and enter their email, 4) Select their permission level (viewer, operator, or admin), 5) They will receive an invitation email to set up their account.",
  },
  {
    query: "What is the optimal tilt angle for panels?",
    response:
      "Optimal tilt angle depends on your latitude. General guidelines: For locations at 0-25 latitude, use 10-25 degrees; For 25-50 latitude, use 25-40 degrees. Our installation team can calculate the exact angle for maximum annual yield based on your specific location.",
  },
];

// 生成管理员用户
async function seedAdminUsers() {
  console.log("Seeding admin users...");

  const users = [
    {
      email: "demo@example.com",
      password: "DemoPassword123!",
      name: "Demo Admin",
      role: "superadmin" as const,
    },
    {
      email: "viewer@example.com",
      password: "ViewerPass123!",
      name: "Demo Viewer",
      role: "user" as const,
    },
  ];

  for (const user of users) {
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.email, user.email),
    });

    if (existing) {
      console.log(`  User already exists: ${user.email}`);
      continue;
    }

    const hashedPassword = await hash(user.password, 12);
    await db.insert(schema.users).values({
      id: nanoid(),
      name: user.name,
      email: user.email,
      password: hashedPassword,
      role: user.role,
    });
    console.log(`  Created user: ${user.email} (${user.role})`);
  }
}

// 生成终端用户
async function seedEndUsers() {
  console.log("Seeding end users...");

  const endUsers = [];
  for (let i = 0; i < DEMO_CONFIG.END_USERS_COUNT; i++) {
    endUsers.push({
      id: nanoid(),
      externalId: `user_${nanoid(8)}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      totalConversations: faker.number.int({ min: 1, max: 20 }),
      totalSessions: faker.number.int({ min: 1, max: 10 }),
      firstSeenAt: faker.date.past({ years: 1 }),
      lastSeenAt: faker.date.recent({ days: 30 }),
    });
  }

  await db.insert(schema.endUsers).values(endUsers);
  console.log(`  Created ${endUsers.length} end users`);

  return endUsers.map((u) => u.externalId);
}

// 生成对话数据
async function seedConversations(userIds: string[]) {
  console.log("Seeding conversations...");

  const sessionIds = Array.from({ length: DEMO_CONFIG.SESSIONS_COUNT }, () =>
    nanoid(),
  );

  const conversations = [];
  const translations = [];
  const classifications = [];
  const languageDetections = [];

  // 意图分类类别
  const categories = [
    "Technical Support",
    "Product Inquiry",
    "Troubleshooting",
    "Account Management",
    "Feature Request",
    "General FAQ",
  ];

  // 语言列表
  const languages = ["en", "zh-CN", "de", "es", "fr", "ja", "pt"];

  for (let i = 0; i < DEMO_CONFIG.CONVERSATIONS_COUNT; i++) {
    const template =
      DEMO_QA_TEMPLATES[
        faker.number.int({ min: 0, max: DEMO_QA_TEMPLATES.length - 1 })
      ];
    const sessionId =
      sessionIds[faker.number.int({ min: 0, max: sessionIds.length - 1 })];
    const userId = userIds[faker.number.int({ min: 0, max: userIds.length - 1 })];

    const conversationId = i + 1;
    const createdTime = faker.date.recent({ days: 30 }).toISOString();

    // 对话记录
    conversations.push({
      id: conversationId,
      createdTime,
      sessionId,
      traceId: nanoid(),
      tags: faker.helpers.arrayElement([
        "App",
        "Web",
        "App,stationDetailPage",
        "Web,supportCenterPage",
        "",
      ]),
      env: faker.helpers.arrayElement(["prod", "dev"]),
      latency: String(faker.number.int({ min: 100, max: 3000 })),
      userId,
      query: template.query,
      response: template.response,
      metadata: { source: "demo", model: "deepseek-v3" },
      scores: {},
      tag: faker.helpers.arrayElement(["FAQ", "Support", "General", null]),
      precision: String(
        faker.number.float({ min: 0.6, max: 1, fractionDigits: 2 }),
      ),
      relevance: String(
        faker.number.float({ min: 0.6, max: 1, fractionDigits: 2 }),
      ),
      languageMatch: String(
        faker.number.float({ min: 0.8, max: 1, fractionDigits: 2 }),
      ),
      fidelity: String(
        faker.number.float({ min: 0.7, max: 1, fractionDigits: 2 }),
      ),
    });

    // 翻译记录
    translations.push({
      conversationId,
      queryZh: `[中文翻译] ${template.query.slice(0, 50)}...`,
      responseZh: `[中文翻译] ${template.response.slice(0, 100)}...`,
      status: "completed",
    });

    // 分类记录
    classifications.push({
      conversationId,
      category: faker.helpers.arrayElement(categories),
      confidence: String(
        faker.number.float({ min: 0.7, max: 0.99, fractionDigits: 2 }),
      ),
      status: "completed",
    });

    // 语种检测记录
    languageDetections.push({
      conversationId,
      language: faker.helpers.arrayElement(languages),
      confidence: String(
        faker.number.float({ min: 0.85, max: 0.99, fractionDigits: 2 }),
      ),
      status: "completed",
    });
  }

  // 批量插入
  await db.insert(schema.conversations).values(conversations);
  console.log(`  Created ${conversations.length} conversations`);

  await db.insert(schema.conversationTranslations).values(translations);
  console.log(`  Created ${translations.length} translations`);

  await db.insert(schema.conversationClassifications).values(classifications);
  console.log(`  Created ${classifications.length} classifications`);

  await db
    .insert(schema.conversationLanguageDetections)
    .values(languageDetections);
  console.log(`  Created ${languageDetections.length} language detections`);
}

// 生成数据集
async function seedDatasets() {
  console.log("Seeding datasets...");

  // 获取管理员用户
  const admin = await db.query.users.findFirst({
    where: eq(schema.users.email, "demo@example.com"),
  });

  if (!admin) {
    console.log("  Skipping datasets - no admin user found");
    return;
  }

  const datasets = [
    {
      id: nanoid(),
      userId: admin.id,
      name: "FAQ Training Set",
      description: "Common questions for training FAQ bot",
      itemCount: 10,
    },
    {
      id: nanoid(),
      userId: admin.id,
      name: "Technical Support Dataset",
      description: "Technical issues and resolutions",
      itemCount: 8,
    },
  ];

  await db.insert(schema.datasets).values(datasets);
  console.log(`  Created ${datasets.length} datasets`);
}

// 主函数
async function runDemoSeed() {
  console.log("=================================");
  console.log("Running Demo Seed...");
  console.log("=================================\n");

  const start = Date.now();

  try {
    // 1. ���建管理员用户
    await seedAdminUsers();

    // 2. 创建终端用户
    const userIds = await seedEndUsers();

    // 3. 创建对话数据（包含翻译、分类、语种检测）
    await seedConversations(userIds);

    // 4. 创建数据集
    await seedDatasets();

    const end = Date.now();
    console.log("\n=================================");
    console.log(`Demo seed completed in ${end - start}ms`);
    console.log("=================================");
    console.log("\nDemo credentials:");
    console.log("  Admin: demo@example.com / DemoPassword123!");
    console.log("  Viewer: viewer@example.com / ViewerPass123!");
  } catch (error) {
    console.error("Demo seed failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

runDemoSeed().catch((err) => {
  console.error("Demo seed failed");
  console.error(err);
  process.exit(1);
});
