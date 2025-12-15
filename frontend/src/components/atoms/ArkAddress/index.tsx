import { bech32m } from "bech32";
import { useEffect, useState } from "react";

type ASPInfo = {
  aspPubKey: string;
  isTestnet: boolean;
  cachedAt: number;
};

const CACHE_DURATION = 60 * 60 * 1000;
const CACHE_KEY = "arkade_asp_info";
const ASP_URL = "https://arkade.computer/v1/info";

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
    isTestnet: info.network !== "bitcoin",
    cachedAt: Date.now()
  };

  sessionStorage.setItem(CACHE_KEY, JSON.stringify(aspInfo));
  return aspInfo;
}

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
}

function decodeArkScript(
  scriptHex: string,
  aspPubKey: string,
  isTestnet: boolean = false
): string {
  if (!scriptHex.startsWith("5120")) {
    throw new Error("Invalid Ark Taproot script: Expected 5120 prefix");
  }

  const userKeyHex = scriptHex.slice(4);
  const aspPubKeyBytes = hexToBytes(aspPubKey);
  const userKeyBytes = hexToBytes(userKeyHex);
  
  // Construct payload: [version byte 0x00] + [ASP key 33 bytes] + [user key 32 bytes]
  const payload = new Uint8Array(1 + aspPubKeyBytes.length + userKeyBytes.length);
  payload.set([0x00], 0);
  payload.set(aspPubKeyBytes, 1);
  payload.set(userKeyBytes, 1 + aspPubKeyBytes.length);
  
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
      .then(info => {
        const address = decodeArkScript(vtxo.script, info.aspPubKey, info.isTestnet);
        setArkAddress(address);
      })
      .catch(err => {
        console.error("Failed to generate ARK address:", err);
        setArkAddress("Error loading");
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