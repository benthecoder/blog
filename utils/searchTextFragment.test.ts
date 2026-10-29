import { describe, expect, it } from "vitest";
import { textFragment } from "./searchTextFragment";

describe("textFragment", () => {
  it("returns null for code chunks, empty keywords, and misses", () => {
    expect(textFragment("const rice = 1", ["rice"], "code")).toBeNull();
    expect(textFragment("rice", [])).toBeNull();
    expect(textFragment("nothing here", ["rice"])).toBeNull();
    expect(textFragment("", ["rice"])).toBeNull();
  });

  it("finds the first matching bullet and strips the marker", () => {
    const content =
      "notes\n\n• use white fish for less fishy oil\n• don't stir after rice comes to boil";
    expect(textFragment(content, ["stir"])).toBe(
      "#:~:text=don't%20stir%20after%20rice%20comes%20to%20boil"
    );
    expect(textFragment(content, ["fishy"])).toBe(
      "#:~:text=fish%20for%20less%20fishy%20oil"
    );
  });

  it("strips other list, heading, and quote markers", () => {
    expect(textFragment("- alpha rice", ["rice"])).toBe(
      "#:~:text=alpha%20rice"
    );
    expect(textFragment("1. alpha rice", ["rice"])).toBe(
      "#:~:text=alpha%20rice"
    );
    expect(textFragment("## alpha rice", ["rice"])).toBe(
      "#:~:text=alpha%20rice"
    );
    expect(textFragment("> alpha rice", ["rice"])).toBe(
      "#:~:text=alpha%20rice"
    );
  });

  it("turns links into their text and drops emphasis and backticks", () => {
    expect(
      textFragment("a [great rice](https://x.test/rice) **bowl** `now`", [
        "rice",
      ])
    ).toBe("#:~:text=a%20great%20rice%20bowl%20now");
    expect(textFragment("some __bold__ and *it* rice", ["rice"])).toBe(
      "#:~:text=bold%20and%20it%20rice"
    );
  });

  it("does not match keywords that only appear in a url", () => {
    expect(
      textFragment("[docs](https://rice.test)\nplain rice here", ["rice"])
    ).toBe("#:~:text=plain%20rice%20here");
  });

  it("preserves inline-code identifiers from published posts", () => {
    expect(
      textFragment(
        "baking models today, learned the choices for `attn_implementation`:",
        ["attn_implementation"]
      )
    ).toBe("#:~:text=the%20choices%20for%20attn_implementation");
    expect(
      textFragment(
        "  - `import ray.data` -> `ray.data.read_datasource(CustomerDataSource())`",
        ["read_datasource"]
      )
    ).toBe(
      "#:~:text=import%20ray.data%20%2D%3E%20ray.data.read_datasource(CustomerDataSource"
    );
  });

  it("keeps literal emphasis characters inside code and removes outside emphasis", () => {
    expect(
      textFragment("Use `some_*value*` with **care** and __attention__.", [
        "some_",
      ])
    ).toBe("#:~:text=Use%20some_*value*%20with%20care%20and%20attention");
    expect(textFragment("Use ``a`_b`` here", ["_b"])).toBe(
      "#:~:text=Use%20a%60_b%20here"
    );
  });

  it("skips image-only lines and fence markers", () => {
    const content = "![rice photo](/img/rice.jpg)\n```rice\nthen rice later";
    expect(textFragment(content, ["rice"])).toBe(
      "#:~:text=then%20rice%20later"
    );
  });

  it("takes at most 8 words, starting up to 3 before the hit", () => {
    const line = "one two three four five six seven eight nine ten KEY eleven";
    expect(textFragment(line, ["key"])).toBe(
      "#:~:text=eight%20nine%20ten%20KEY%20eleven"
    );
    const early = "alpha beta gamma delta epsilon zeta eta theta iota kappa";
    expect(textFragment(early, ["beta"])).toBe(
      "#:~:text=alpha%20beta%20gamma%20delta%20epsilon%20zeta%20eta%20theta"
    );
  });

  it("trims punctuation at the window edges", () => {
    expect(textFragment("(first) rice, done.", ["rice"])).toBe(
      "#:~:text=first)%20rice%2C%20done"
    );
  });

  it("encodes dashes, commas and ampersands as text directive syntax", () => {
    expect(textFragment("slow-cooked rice, salt & pepper", ["rice"])).toBe(
      "#:~:text=slow%2Dcooked%20rice%2C%20salt%20%26%20pepper"
    );
  });
});
