import { describe, expect, it } from "vitest";
import { countByRule, lintDesign, type Baseline } from "./designLint";

const baseline: Baseline = {
  "raw-html": {
    "app/legacy.tsx": 1,
  },
};

describe("lintDesign", () => {
  it("flags a raw hex color and a Tailwind palette class", () => {
    const findings = lintDesign([
      {
        file: "app/page.tsx",
        source: 'export const accent = "#21201c";\nconst x = "bg-red-500";\n',
      },
    ]);
    expect(findings.map((f) => f.rule)).toEqual(["hex", "palette"]);
    expect(findings.every((f) => f.level === "error")).toBe(true);
  });

  it("skips an allowed hex in the named file", () => {
    const findings = lintDesign(
      [
        {
          file: "app/colophon/page.tsx",
          source: 'const swatch = "#4d5f9e";\n',
        },
      ],
      {
        allow: [
          { file: "app/colophon/page.tsx", match: "#4d5f9e", reason: "swatch" },
        ],
      }
    );
    expect(findings).toEqual([]);
  });

  it("flags one-off px and rem values, not typographic or grid units", () => {
    const findings = lintDesign([
      {
        file: "app/page.tsx",
        source: [
          'const bad = "p-[13px] text-[10px] h-[22rem]";',
          'const ok = "p-3 max-w-[65ch] min-h-[50vh] grid-cols-[6rem_1fr] ease-[cubic-bezier(0.23,1,0.32,1)] scale-[0.97]";',
          "",
        ].join("\n"),
      },
    ]);
    expect(
      findings.filter((f) => f.rule === "one-off").map((f) => f.match)
    ).toEqual(["p-[13px]", "text-[10px]", "h-[22rem]"]);
    expect(findings.find((f) => f.match === "text-[10px]")?.hint).toMatch(
      /text-3xs/
    );
  });

  it("flags a plain button, but not one inside a primitive component", () => {
    const source = '<button type="button">Save</button>\n';
    const page = lintDesign([{ file: "app/page.tsx", source }]);
    expect(page.map((f) => f.rule)).toEqual(["raw-html"]);
    expect(page[0]?.level).toBe("error");

    const primitive = lintDesign([
      { file: "components/ui/Button.tsx", source },
    ]);
    expect(primitive).toEqual([]);
  });

  it("treats baselined leftover buttons as warnings, and a new one as an error", () => {
    const findings = lintDesign(
      [
        { file: "app/legacy.tsx", source: "<button>Old</button>\n" },
        { file: "app/new.tsx", source: "<button>New</button>\n" },
      ],
      { baseline }
    );
    const byFile = Object.fromEntries(findings.map((f) => [f.file, f.level]));
    expect(byFile["app/legacy.tsx"]).toBe("warn");
    expect(byFile["app/new.tsx"]).toBe("error");
  });

  it("errors when a file goes over its raw-html baseline", () => {
    const findings = lintDesign(
      [
        {
          file: "app/legacy.tsx",
          source: "<button>One</button>\n<button>Two</button>\n",
        },
      ],
      { baseline }
    );
    expect(findings).toHaveLength(2);
    expect(findings.every((f) => f.level === "error")).toBe(true);
    expect(findings[0]?.hint).toMatch(/baseline allows 1, found 2/);
  });

  it("flags two solid buttons in one view, and allows a single one", () => {
    const two = lintDesign([
      {
        file: "app/page.tsx",
        source: [
          '<Button variant="solid">Save</Button>',
          '<ButtonLink variant="solid" href="/">Cancel</ButtonLink>',
          "",
        ].join("\n"),
      },
    ]);
    expect(two.map((f) => f.rule)).toEqual([
      "limit-per-view",
      "limit-per-view",
    ]);

    const one = lintDesign([
      {
        file: "app/page.tsx",
        source: '<Button variant="solid">Save</Button>\n',
      },
    ]);
    expect(one).toEqual([]);
  });

  it("allows multiple solid buttons on the design specimen page", () => {
    const findings = lintDesign([
      {
        file: "app/design/page.tsx",
        source: [
          '<Button variant="solid">solid</Button>',
          '<Button variant="solid" tone="danger">danger</Button>',
          "",
        ].join("\n"),
      },
    ]);
    expect(findings).toEqual([]);
  });

  it("counts findings by rule and level", () => {
    const findings = lintDesign(
      [
        { file: "app/legacy.tsx", source: "<button>Old</button>\n" },
        { file: "app/page.tsx", source: 'const x = "p-[13px]";\n' },
      ],
      { baseline }
    );
    expect(countByRule(findings, "error")).toEqual({ "one-off": 1 });
    expect(countByRule(findings, "warn")).toEqual({ "raw-html": 1 });
  });
});
