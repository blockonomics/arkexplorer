import { useEffect, useState } from "react";
import { ARK_ADDRESS_VERSION, ASP_URL, CACHE_DURATION, CACHE_KEY } from "../../../constants";
import { ArkAddress } from "@arkade-os/sdk";

// --- Types and Constants ---

type ASPInfo = {
  aspPubKey: string; // 33-byte compressed key hex
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

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have an even length.");
  }
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
}

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

  // 1. Extract user key (vtxoTaprootKey) from the script
  const userKeyHex = scriptHex.slice(4);
  const vtxoTaprootKey = hexToBytes(userKeyHex);

  // 2. Convert ASP key (serverPubKey) from 33-byte compressed to 32-byte x-only
  const aspPubKeyBytes33 = hexToBytes(aspPubKey);
  const serverPubKey = keyToXOnlyBytes(aspPubKeyBytes33);

  // 3. Determine HRP
  const hrp = isTestnet ? "tark" : "ark";

  // 4. Use ArkAddress to construct and encode
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
        <div className="font-mono text-sm break-all text-blue-600 hover:text-blue-700">
          {arkAddress}
        </div>
      </div>
    </div>
  );
};