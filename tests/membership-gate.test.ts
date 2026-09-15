import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MEMBERSHIP_GATE_ENV,
  resolveMembershipGateEnabled,
} from "../apps/geolibre-desktop/src/lib/membership-gate";

describe("membership landing gate", () => {
  it("stays off unless the deployment opts in", () => {
    assert.equal(resolveMembershipGateEnabled(true, {}, {}), false);
  });

  it("accepts the documented truthy spellings, case-insensitively", () => {
    for (const value of ["1", "true", "TRUE", " True "]) {
      assert.equal(
        resolveMembershipGateEnabled(true, { [MEMBERSHIP_GATE_ENV]: value }, {}),
        true,
      );
    }
  });

  it("treats any other value as off", () => {
    for (const value of ["0", "false", "off", "no", "yes", "gate"]) {
      assert.equal(
        resolveMembershipGateEnabled(true, { [MEMBERSHIP_GATE_ENV]: value }, {}),
        false,
      );
    }
  });

  it("prefers the Docker runtime flag over the build-time flag", () => {
    assert.equal(
      resolveMembershipGateEnabled(
        true,
        { [MEMBERSHIP_GATE_ENV]: "0" },
        { [MEMBERSHIP_GATE_ENV]: "1" },
      ),
      false,
    );
    assert.equal(
      resolveMembershipGateEnabled(
        true,
        { [MEMBERSHIP_GATE_ENV]: "1" },
        { [MEMBERSHIP_GATE_ENV]: "0" },
      ),
      true,
    );
  });

  it("falls back to the build-time flag", () => {
    assert.equal(
      resolveMembershipGateEnabled(true, {}, { [MEMBERSHIP_GATE_ENV]: "1" }),
      true,
    );
  });

  it("never applies to native or embedded applications, however it's configured", () => {
    assert.equal(
      resolveMembershipGateEnabled(false, { [MEMBERSHIP_GATE_ENV]: "1" }, {}),
      false,
    );
  });
});
