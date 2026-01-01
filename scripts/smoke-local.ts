const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:12138";

async function expectStatus(path: string, expected: number) {
  const url = new URL(path, BASE_URL).toString();
  const res = await fetch(url, { redirect: "manual" });
  if (res.status !== expected) {
    const location = res.headers.get("location");
    throw new Error(
      `Expected ${expected} for ${path}, got ${res.status}${
        location ? ` (location: ${location})` : ""
      }`,
    );
  }
}

async function main() {
  await expectStatus("/api/users", 401);
  await expectStatus("/api/public/dashboard/schema", 401);
  await expectStatus("/api/tasks/status", 401);

  console.log("smoke-local: OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
