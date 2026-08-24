import { afterEach } from "vitest";
import { resetLockOverrides } from "@xanots/sdk";

afterEach(() => {
  resetLockOverrides();
});
