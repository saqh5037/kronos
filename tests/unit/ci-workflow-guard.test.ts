/**
 * The `run-e2e` label has to actually start a run.
 *
 * `pull_request` defaults to the activity types opened/synchronize/reopened, so
 * before `labeled` was opted into, labelling an already-open PR fired no event
 * at all: the e2e job's label condition was only ever evaluated against the
 * labels that happened to be attached when the PR was opened or last pushed to.
 * The documented escape hatch for a change touching booking, auth or tenancy
 * silently did nothing, and the only way to get the suite was a manual
 * `workflow_dispatch`.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const WORKFLOW = path.resolve(__dirname, "../../.github/workflows/ci.yml");
const src = readFileSync(WORKFLOW, "utf8");

describe("CI workflow", () => {
  it("opts pull_request into the labeled activity type", () => {
    const types = /^\s*types:\s*\[([^\]]+)\]/m.exec(src);
    expect(
      types,
      "pull_request needs an explicit `types:` list",
    ).not.toBeNull();
    const listed = types![1].split(",").map((t) => t.trim());
    expect(listed).toContain("labeled");
    // The defaults must be restated: declaring `types` replaces them.
    expect(listed).toContain("opened");
    expect(listed).toContain("synchronize");
    expect(listed).toContain("reopened");
  });

  it("gates the e2e job on the run-e2e label", () => {
    expect(src).toContain("run-e2e");
    expect(src).toMatch(
      /contains\(github\.event\.pull_request\.labels\.\*\.name,\s*'run-e2e'\)/,
    );
  });

  it("does not re-run quality for a label change", () => {
    // Adding a label moves no code, so typecheck/lint/test/build have nothing
    // new to say — and a full quality run on every label edit is pure waste.
    expect(src).toMatch(/if:\s*github\.event\.action\s*!=\s*'labeled'/);
  });

  it("still runs e2e on demand and nightly", () => {
    expect(src).toContain("github.event_name == 'workflow_dispatch'");
    expect(src).toContain("github.event_name == 'schedule'");
    expect(src).toMatch(/cron:\s*'0 8 \* \* \*'/);
  });
});
