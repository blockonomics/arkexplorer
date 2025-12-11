import { bech32 } from "bech32";

function decodeArkScript(scriptHex: string, prefix: "ark:" | "tark:" = "ark:"): string {
  // Ark scripts are "51 20 <32-byte key>"
  if (!scriptHex.startsWith("5120")) {
    throw new Error("Invalid Ark Taproot script");
  }

  // Strip the "51 20" prefix (4 hex chars = 2 bytes)
  const keyHex = scriptHex.slice(4);
  
  // Convert hex string to Uint8Array (Bun-native approach)
  const keyBytes = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  // Convert to Bech32m words
  const words = bech32.toWords(keyBytes);

  // Encode with Bech32m (Ark uses Bech32m, not Bech32)
  return bech32.encode(prefix, words, 90);
}

type ArkAddressProps = {
  vtxo: { script: string };
};

export const ArkAddress: React.FC<ArkAddressProps> = ({ vtxo }) => {
  let arkAddress: string;
  try {
    arkAddress = decodeArkScript(vtxo.script, "ark:"); // use "ark" for mainnet
  } catch (err) {
    console.error(err);
    arkAddress = "Invalid script";
  }

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