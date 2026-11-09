import { existsSync, readFileSync } from "fs";
import path from "path";
import { load as loadYaml } from "js-yaml";

type MapNode = {
  id?: string;
  title?: string;
  label?: string;
  area?: string;
};

type MapDoc = {
  title?: string;
  concepts?: MapNode[];
  nodes?: MapNode[];
};

function loadMap(): MapDoc | null {
  const candidates = [
    path.join(process.cwd(), "data", "knowledge-map.yaml"),
    path.join(process.cwd(), "knowledge-map.yaml"),
    "/workspace/learn/research/knowledge-map.yaml",
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const raw = loadYaml(readFileSync(file, "utf8"));
      if (raw && typeof raw === "object") return raw as MapDoc;
    } catch {
      return null;
    }
  }
  return null;
}

export default function KnowledgeMapSlot() {
  const doc = loadMap();
  if (!doc) return null;
  const items = doc.concepts || doc.nodes || [];
  if (!items.length) return null;
  const groups: { area: string; items: MapNode[] }[] = [];
  for (const item of items) {
    const area = item.area || "other";
    const existing = groups.find((group) => group.area === area);
    if (existing) existing.items.push(item);
    else groups.push({ area, items: [item] });
  }
  return (
    <section className="mt-12">
      <h2>knowledge map</h2>
      {groups.map((group) => (
        <section key={group.area}>
          {groups.length > 1 ? <h3>{group.area}</h3> : null}
          <ul>
            {group.items.map((item, index) => (
              <li key={item.id || item.title || item.label || String(index)}>
                {item.title || item.label || item.id}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
