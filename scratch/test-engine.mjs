import { validatePasscode, signSession, verifySession } from "../lib/auth.ts";
import { PAGE_REGISTRY, isValidRoute, getNextRoute, getPageByRoute, DEFAULT_ROUTE } from "../lib/pageRegistry.ts";
import { screenStore } from "../lib/screenStore.ts";

async function runTests() {
  console.log("==========================================");
  console.log("RUNNING REVISED VALIDATION SUITE");
  console.log("==========================================");

  // 1. Auth & Crypto Tests
  console.log("\n[1] Testing Auth & HMAC Signing...");
  const validController = validatePasscode("controller", "admin123");
  const validScreen = validatePasscode("screen", "screen123");
  if (!validController || !validScreen) {
    throw new Error("Passcode validation failed!");
  }
  console.log("✓ Passcode validation confirmed.");

  const token = await signSession({ role: "controller", name: "HQ Admin" });
  const verified = await verifySession(token);
  if (!verified || verified.role !== "controller") {
    throw new Error("Session sign/verify failed!");
  }
  console.log("✓ Session token signed and verified.");

  // 2. Page Registry Tests
  console.log("\n[2] Testing Page Registry & Default Route...");
  console.log(`Default route: ${DEFAULT_ROUTE}`);
  if (DEFAULT_ROUTE !== "/screen/sample") {
    throw new Error(`Expected DEFAULT_ROUTE to be /screen/sample, got ${DEFAULT_ROUTE}`);
  }

  const samplePage = getPageByRoute("/screen/sample");
  if (!samplePage) {
    throw new Error("Missing /screen/sample in pageRegistry!");
  }
  console.log(`✓ /screen/sample registered: "${samplePage.title}"`);
  console.log(`✓ Total registry entries: ${PAGE_REGISTRY.length}`);

  // 3. Screen Store & Multi-Screen Targeting Tests
  console.log("\n[3] Testing Screen Store...");
  const screenA = screenStore.registerScreen("screen-lobby", "Lobby Display");
  if (!screenA || screenA.activeRoute !== "/screen/sample") {
    throw new Error(`Screen should initialize with /screen/sample, got ${screenA?.activeRoute}`);
  }
  console.log(`✓ Screen initialized with default route: ${screenA.activeRoute}`);

  // Ticker Test
  screenStore.setTicker("screen-lobby", "Welcome to Nexus Digital Signage");
  const updatedA = screenStore.getScreen("screen-lobby");
  if (updatedA.tickerMessage !== "Welcome to Nexus Digital Signage") {
    throw new Error("Ticker message failed to update!");
  }
  console.log(`✓ Screen ticker updated: "${updatedA.tickerMessage}"`);

  console.log("\n==========================================");
  console.log("ALL TESTS PASSED SUCCESSFULLY! (100% OK)");
  console.log("==========================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
