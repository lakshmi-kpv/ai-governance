import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });

const BANDS = ["Early", "Developing", "Established"];

export default async () => {
  const store = getStore("assessments");
  const { blobs } = await store.list();
  const records = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);

  const industries = {};
  const overall = { Early: 0, Developing: 0, Established: 0, "Not assessed": 0 };
  const pillars = {};
  const questions = Array.from({ length: 19 }, () => ({ Early: 0, Developing: 0, Established: 0, dk: 0 }));

  for (const r of records) {
    if (r.industry) industries[r.industry] = (industries[r.industry] || 0) + 1;
    if (r.overall in overall) overall[r.overall]++;
    for (const p of r.pillars || []) {
      if (!pillars[p.name]) pillars[p.name] = { Early: 0, Developing: 0, Established: 0, "Not assessed": 0 };
      if (p.band in pillars[p.name]) pillars[p.name][p.band]++;
    }
    (r.answers || []).forEach((v, i) => {
      if (!questions[i]) return;
      if (v === "dk") questions[i].dk++;
      else if (v === 1) questions[i].Early++;
      else if (v === 2) questions[i].Developing++;
      else if (v === 3) questions[i].Established++;
    });
  }

  return json({ total: records.length, industries, overall, pillars, questions });
};

export const config = { path: "/api/results" };
