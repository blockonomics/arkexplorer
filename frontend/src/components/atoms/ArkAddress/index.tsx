import { useEffect, useState } from "react";
import { hexToBytes } from "@noble/hashes/utils";
import { ArkAddress } from "@arkade-os/sdk";
import { ARK_ADDRESS_VERSION, ASP_URL, CACHE_DURATION, CACHE_KEY } from "../../../constants";

// --- Types ---

type ASPInfo = {
  aspPubKey: string; 
  isTestnet: boolean;
  cachedAt: number;
};

// --- Utility Functions ---

async function getASPInfo(): Promise<ASPInfo> {
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) {
    const aspInfo: ASPInfo = JSON.parse(cached);
    if (Date.now() - aspInfo.cachedAt < CACHE_DURATION) {
      return aspInfo;
    }
  }

  const response = await fetch(ASP_URL);
  const info = await response.json();

  const aspInfo: ASPInfo = {
    aspPubKey: info.signerPubkey,
    isTestnet: info.network !== "bitcoin",
    cachedAt: Date.now(),
  };

  sessionStorage.setItem(CACHE_KEY, JSON.stringify(aspInfo));
  return aspInfo;
}

/**
 * Strips the first byte of a compressed public key to get the x-only key.
 */
function keyToXOnlyBytes(keyBytes33: Uint8Array): Uint8Array {
  if (keyBytes33.length !== 33) {
    throw new Error("Key must be 33 bytes (compressed public key)");
  }
  return keyBytes33.slice(1);
}

// --- Core Logic ---

function generateArkAddress(
  scriptHex: string,
  aspPubKey: string,
  isTestnet: boolean = false
): string {
  if (!scriptHex.startsWith("5120")) {
    throw new Error("Invalid Ark Taproot script: Expected 5120 prefix");
  }

  // 1. Extract user key (vtxoTaprootKey)
  const userKeyHex = scriptHex.slice(4);
  const vtxoTaprootKey = hexToBytes(userKeyHex);

  // 2. Convert ASP key
  const aspPubKeyBytes33 = hexToBytes(aspPubKey);
  const serverPubKey = keyToXOnlyBytes(aspPubKeyBytes33);

  // 3. Determine HRP
  const hrp = isTestnet ? "tark" : "ark";

  // 4. Construct and encode
  const arkAddress = new ArkAddress(
    serverPubKey,
    vtxoTaprootKey,
    hrp,
    ARK_ADDRESS_VERSION,
  );

  return arkAddress.encode();
}

// --- React Component ---

type ArkAddressProps = {
  vtxo: { script: string };
};

export const ArkAddressField: React.FC<ArkAddressProps> = ({ vtxo }) => {
  const [arkAddress, setArkAddress] = useState<string>("Loading...");

  useEffect(() => {
    getASPInfo()
      .then((info) => {
        const address = generateArkAddress(vtxo.script, info.aspPubKey, info.isTestnet);
        setArkAddress(address);
      })
      .catch((err) => {
        console.error("Failed to generate ARK address:", err);
        setArkAddress(`Error: ${err instanceof Error ? err.message : "loading failed"}`);
      });
  }, [vtxo.script]);

  return (
    <div>
      <div className="text-sm font-semibold text-gray-700 mb-2">Ark Address</div>
      <div className="bg-gray-50 rounded p-3 border border-gray-200">
        <div className="font-mono text-sm break-all text-blue-600">
          {arkAddress}
        </div>
      </div>
    </div>
  );
};