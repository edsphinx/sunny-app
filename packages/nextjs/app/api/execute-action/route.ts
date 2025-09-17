import { NextResponse } from "next/server";
import { Abi, createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const serverSecret = process.env.API_SECRET_KEY;

  if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const obfuscatedToken = authHeader.split(" ")[1];
  try {
    const decodedToken = Buffer.from(obfuscatedToken, "base64").toString("utf8");
    if (decodedToken !== serverSecret) {
      return NextResponse.json({ error: "Unauthorized: Invalid credentials" }, { status: 401 });
    }
  } catch (error) {
    console.error("❌ Error de autenticación: El token no pudo ser decodificado.", error);
    return NextResponse.json({ error: "Invalid token format" }, { status: 401 });
  }

  const { vaultAddress } = await request.json();
  if (!vaultAddress) {
    return NextResponse.json({ error: "Falta vaultAddress" }, { status: 400 });
  }

  const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL;
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!rpcUrl || !adminPrivateKey) {
    return NextResponse.json({ error: "Configuración del servidor incompleta." }, { status: 500 });
  }
  const account = privateKeyToAccount(`0x${adminPrivateKey.replace("0x", "")}`);
  const publicClient = createPublicClient({ chain: arbitrumSepolia, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: arbitrumSepolia, transport: http(rpcUrl) });

  const vaultContractInfo = deployedContracts[arbitrumSepolia.id].CommitmentVault;

  try {
    const [, , isRedeemed, isDissolved, , userB_redeem, userA_dissolve, userB_dissolve] =
      (await publicClient.readContract({
        address: vaultAddress,
        abi: vaultContractInfo.abi as Abi,
        functionName: "getVaultInfo",
      })) as [string, string, boolean, boolean, boolean, boolean, boolean, boolean];

    if (isRedeemed || isDissolved) {
      return NextResponse.json({ message: "La bóveda ya está resuelta." });
    }

    if (userB_redeem) {
      const { request } = await publicClient.simulateContract({
        address: vaultAddress,
        abi: vaultContractInfo.abi,
        functionName: "executeRedemption",
        account,
      });
      const hash = await walletClient.writeContract(request);
      console.log(`🤖 Backend ejecutó 'executeRedemption' en ${vaultAddress}. Hash:`, hash);
      return NextResponse.json({ success: true, action: "executeRedemption", hash });
    }

    if (userA_dissolve && userB_dissolve) {
      const { request } = await publicClient.simulateContract({
        address: vaultAddress,
        abi: vaultContractInfo.abi,
        functionName: "executeDissolution",
        account,
      });
      const hash = await walletClient.writeContract(request);
      console.log(`🤖 Backend ejecutó 'executeDissolution' en ${vaultAddress}. Hash:`, hash);
      return NextResponse.json({ success: true, action: "executeDissolution", hash });
    }

    return NextResponse.json({ success: true, action: "none", message: "Aún no hay nada que ejecutar." });
  } catch (error: any) {
    console.error("❌ Error en la API de ejecución:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
