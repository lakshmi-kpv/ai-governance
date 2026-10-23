import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let data;
  try {
    data = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!data || !Array.isArray(data.answers) || data.answers.length !== 19) {
    return json({ error: "Invalid payload" }, 400);
  }

  const record = {
    received: new Date().toISOString(),
    industry: String(data.industry || "").slice(0, 100),
    overall: String(data.overall || "").slice(0, 40),
    pillars: Array.isArray(data.pillars)
      ? data.pillars.slice(0, 10).map((p) => ({
          name: String(p.name || "").slice(0, 80),
          band: String(p.band || "").slice(0, 20)
        }))
      : [],
    answers: data.answers.map((v) => (v === 1 || v === 2 || v === 3 || v === "dk" ? v : null))
  };

  const key = Date.now().toString(36) + "-" + crypto.randomUUID();
  await getStore("assessments").setJSON(key, record);
  return json({ ok: true });
};

export const config = { path: "/api/submit" };
