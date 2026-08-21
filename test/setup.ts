import { afterEach } from "vitest";
import { resetLockOverrides } from "@xanots/core";

afterEach(() => {
  resetLockOverrides();
});
