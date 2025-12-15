import { bech32m } from "bech32";
import { useEffect, useState } from "react";
import { ASP_URL, CACHE_DURATION, CACHE_KEY } from "../../../constants";

type ASPInfo = {
  aspPubKey: string;
  isTestnet: boolean;
  cachedAt: number;
};


/**
 * Fetches the Ark Service Provider (ASP) info, using session storage cache.
 */
async function getASPInfo(): Promise<ASPInfo> {
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) {
    const aspInfo: ASPInfo = JSON.parse(cached);
    const age = Date.now() - aspInfo.cachedAt;

    if (age < CACHE_DURATION) {
      return aspInfo;
    }
  }

  const response = await fetch(ASP_URL);
  const info = await response.json();

  const aspInfo: ASPInfo = {
    aspPubKey: info.signerPubkey,
    // Arkade uses "bitcoin" for mainnet. Anything else is considered testnet.
    isTestnet: info.network !== "bitcoin",
    cachedAt: Date.now(),
  };

  sessionStorage.setItem(CACHE_KEY, JSON.stringify(aspInfo));
  return aspInfo;
}

/**
 * Converts a hex string to a Uint8Array.
 */
function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
}

/**
 * Converts a 33-byte compressed public key (0x02 or 0x03 prefix)
 * to a 32-byte x-only public key, as required for Taproot addresses.
 */
function keyToXOnlyBytes(keyBytes33: Uint8Array): Uint8Array {
  if (keyBytes33.length !== 33) {
    throw new Error("Key must be 33 bytes (compressed public key)");
  }
  return keyBytes33.slice(1); // Strip prefix to get x-coordinate
}

/**
 * Decodes the Ark Taproot script (which contains the user's x-only key)
 * into the Bech32m-encoded Ark Address.
 *
 * Payload structure:
 * [Version Byte (0x00)] + [ASP X-Only Key (32 bytes)] + [User X-Only Key (32 bytes)]
 * Total size: 65 bytes
 */
function decodeArkScript(
  scriptHex: string,
  aspPubKey: string, // 33-byte compressed key hex
  isTestnet: boolean = false
): string {
  if (!scriptHex.startsWith("5120")) {
    throw new Error("Invalid Ark Taproot script: Expected 5120 prefix");
  }

  // Extract user key (32 bytes)
  const userKeyHex = scriptHex.slice(4);
  const userKeyBytes32 = hexToBytes(userKeyHex);

  // Convert ASP key to x-only
  const aspPubKeyBytes33 = hexToBytes(aspPubKey);
  const aspKeyBytes32 = keyToXOnlyBytes(aspPubKeyBytes33);

  // Construct payload
  const payload = new Uint8Array(1 + aspKeyBytes32.length + userKeyBytes32.length);
  payload.set([0x00], 0); // Version byte
  payload.set(aspKeyBytes32, 1);
  payload.set(userKeyBytes32, 1 + aspKeyBytes32.length);

  // Encode Bech32m
  const words = bech32m.toWords(payload);
  const prefix = isTestnet ? "tark" : "ark";

  return bech32m.encode(prefix, words, 1023);
}

type ArkAddressProps = {
  vtxo: { script: string };
};

export const ArkAddress: React.FC<ArkAddressProps> = ({ vtxo }) => {
  const [arkAddress, setArkAddress] = useState<string>("Loading...");

  useEffect(() => {
    getASPInfo()
      .then((info) => {
        const address = decodeArkScript(vtxo.script, info.aspPubKey, info.isTestnet);
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