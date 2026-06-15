import { NextRequest, NextResponse } from "next/server";

const REFERRAL_INTENT = /therapist|counselor|counseling|therapy|psychologist|psychiatrist|mental health (provider|professional|help)|find.*(help|support|someone to talk)|near me|in my area|recommend.*someone|referral|local (help|support|therapist)/i;

interface NPPESAddress { address_purpose: string; address_1?: string; city?: string; state?: string; postal_code?: string; telephone_number?: string; }
interface NPPESBasic { first_name?: string; last_name?: string; organization_name?: string; credential?: string; status?: string; }
interface NPPESTaxonomy { desc?: string; primary?: boolean; }
interface NPPESResult { basic?: NPPESBasic; addresses?: NPPESAddress[]; taxonomies?: NPPESTaxonomy[]; }

async function fetchNearbyTherapists(zipCode: string): Promise<string> {
  try {
    const searchTerms = ["Mental Health", "Counselor", "Psychologist", "Marriage & Family Therapist"];
    const allResults: NPPESResult[] = [];
    await Promise.all(searchTerms.map(async (term) => {
      const url = new URL("https://npiregistry.cms.hhs.gov/api/");
      url.searchParams.set("version", "2.1");
      url.searchParams.set("taxonomy_description", term);
      url.searchParams.set("postal_code", zipCode);
      url.searchParams.set("limit", "5");
      url.searchParams.set("enumeration_type", "NPI-1");
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) return;
      const data = await res.json();
      allResults.push(...(data?.results ?? []));
    }));
    if (!allResults.length) return "";
    const seen = new Set<string>();
    const listings: string[] = [];
    for (const provider of allResults) {
      if (listings.length >= 6) break;
      const basic = provider.basic;
      if (!basic || basic.status !== "A") continue;
      const locationAddr = provider.addresses?.find((a) => a.address_purpose === "LOCATION");
      if (!locationAddr) continue;
      const name = basic.organization_name ? basic.organization_name : `${basic.first_name ?? ""} ${basic.last_name ?? ""}`.trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      const credential = basic.credential ? `, ${basic.credential}` : "";
      const taxonomy = provider.taxonomies?.find((t) => t.primary)?.desc ?? "";
      const specialty = taxonomy ? ` (${taxonomy})` : "";
      const addr = [locationAddr.address_1, locationAddr.city, locationAddr.state, locationAddr.postal_code?.slice(0, 5)].filter(Boolean).join(", ");
      const phone = locationAddr.telephone_number ? ` — Phone: ${locationAddr.telephone_number}` : "";
      listings.push(`${listings.length + 1}. ${name}${credential}${specialty} — ${addr}${phone}`);
    }
    if (!listings.length) return "";
    return `\n\n[Licensed mental health providers near zip code ${zipCode}:\n${listings.join("\n")}\nSource: NPPES NPI Registry]`;
  } catch { return ""; }
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, "$1").replace(/\*(.+?)\*/gs, "$1")
    .replace(/_{2}(.+?)_{2}/gs, "$1").replace(/_(.+?)_/gs, "$1")
    .replace(/#{1,6}\s+/g, "").replace(/`{3}[\s\S]*?`{3}/g, "").replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.*?\)/g, "$1").replace(/^[-*+]\s+/gm, "- ")
    .replace(/^\s*>\s+/gm, "").replace(/^-{3,}$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}

export async function POST(req: NextRequest) {
  const { message, sessionId, zipCode } = await req.json();
  if (!message || !sessionId) return NextResponse.json({ error: "Missing message or sessionId" }, { status: 400 });

  let enrichedMessage = message;
  if (zipCode && REFERRAL_INTENT.test(message)) {
    const ctx = await fetchNearbyTherapists(zipCode);
    if (ctx) enrichedMessage = message + ctx;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(process.env.N8N_CHAT_URL!, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: enrichedMessage, sessionId }), signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return NextResponse.json({ error: "Workflow error" }, { status: 502 });
    const data = await res.json();
    return NextResponse.json({ output: stripMarkdown(data.output ?? "") });
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") return NextResponse.json({ error: "Request timed out. Try again." }, { status: 504 });
    return NextResponse.json({ error: "Could not reach Coach." }, { status: 500 });
  }
}
