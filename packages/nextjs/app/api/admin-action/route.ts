"use server";

import { NextResponse } from "next/server";
import { Abi, createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";
import { ContractName } from "~~/utils/scaffold-eth/contract";

/**
 * * @author edsphinx
 * @notice Este archivo define un endpoint de API genérico para ejecutar transacciones de smart contracts
 * que requieren privilegios de administrador (onlyOwner).
 * @dev Utiliza una clave de API ofuscada para una autorización temporal y una lista blanca estricta
 * para limitar las funciones que pueden ser llamadas. La transacción es firmada y enviada por una
 * cuenta de administrador cuya clave privada se almacena de forma segura en el servidor.
 */

/**
 * @notice Lista blanca de contratos y funciones que el backend tiene permitido invocar.
 * @dev Este mapeo es una medida de seguridad crucial para prevenir que este endpoint
 * sea utilizado para llamar funciones no deseadas o peligrosas. Solo las funciones
 * explícitamente listadas aquí podrán ser ejecutadas.
 */
const ALLOWED_ACTIONS: Record<ContractName, string[]> = {
  ProofOfMatch: ["createMatch"],
  MatchData: ["recordInteraction"],
  ExperienceNFT: ["mintExperience"],
  CommitmentVaultFactory: [],
  PresenceScore: [],
  CommitmentVault: [],
};

/**
 * @notice Maneja las peticiones POST para ejecutar una acción de administrador.
 * @dev El flujo de ejecución es el siguiente:
 * 1. Autenticación: Verifica una cabecera 'Authorization' con un token Bearer ofuscado en Base64.
 * 2. Parsing: Extrae los parámetros `contractName`, `functionName`, y `args` del cuerpo de la petición.
 * 3. Whitelisting: Valida que la acción solicitada esté en la lista `ALLOWED_ACTIONS`.
 * 4. Ejecución: Configura un cliente `viem` con la wallet de administrador, simula y envía la transacción.
 * @param {Request} request - El objeto de la petición entrante de Next.js.
 * @returns {NextResponse} Una respuesta JSON con el hash de la transacción si es exitosa, o un objeto de error.
 */
export async function POST(request: Request) {
  // 🚨 TODO: La autenticación actual mediante una clave pública ofuscada es una medida temporal
  // y NO es segura contra un atacante determinado. Debe ser reemplazada por un sistema de
  // autenticación robusto (ej. NextAuth.js con sesiones o JWTs) o migrar la lógica a Next.js Server Actions,
  // que eliminan la necesidad de un endpoint de API público.
  const authHeader = request.headers.get("Authorization");
  const serverSecret = process.env.API_SECRET_KEY;

  if (!authHeader || !authHeader.startsWith("Bearer ") || !serverSecret) {
    return NextResponse.json({ error: "Unauthorized: Missing credentials" }, { status: 401 });
  }

  const obfuscatedToken = authHeader.split(" ")[1];

  try {
    // Decodifica el token desde Base64. `Buffer` es nativo de Node.js.
    const decodedToken = Buffer.from(obfuscatedToken, "base64").toString("utf8");

    // Compara el token decodificado con el secreto del servidor.
    if (decodedToken !== serverSecret) {
      return NextResponse.json({ error: "Unauthorized: Invalid credentials" }, { status: 401 });
    }
  } catch (error) {
    // Este error ocurre si el token no es un string Base64 válido.
    console.error("❌ Error de autenticación: El token no pudo ser decodificado.", error);
    return NextResponse.json({ error: "Invalid token format" }, { status: 401 });
  }

  // --- A partir de aquí, la petición está autenticada ---

  const { contractName, functionName, args } = await request.json();
  if (!contractName || !functionName || !args) {
    return NextResponse.json({ error: "Faltan parámetros: contractName, functionName, args" }, { status: 400 });
  }

  const allowedFunctions = ALLOWED_ACTIONS[contractName as ContractName];
  if (!allowedFunctions || !allowedFunctions.includes(functionName)) {
    return NextResponse.json(
      { error: `Función '${functionName}' no autorizada para el contrato '${contractName}'` },
      { status: 403 },
    );
  }

  const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL;
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;

  if (!rpcUrl || !adminPrivateKey) {
    console.error("❌ Configuración del servidor incompleta: Falta RPC_URL o ADMIN_PRIVATE_KEY.");
    return NextResponse.json({ error: "Configuración del servidor incompleta." }, { status: 500 });
  }

  const account = privateKeyToAccount(`0x${adminPrivateKey.replace("0x", "")}`);
  const publicClient = createPublicClient({ chain: arbitrumSepolia, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: arbitrumSepolia, transport: http(rpcUrl) });

  const contract = deployedContracts[arbitrumSepolia.id][contractName as ContractName];
  if (!contract) {
    return NextResponse.json({ error: `Contrato '${contractName}' no encontrado` }, { status: 404 });
  }

  try {
    // Se simula la transacción primero para validar que no fallará en la blockchain.
    const { request: contractRequest } = await publicClient.simulateContract({
      address: contract.address,
      abi: contract.abi as Abi,
      functionName,
      args,
      account,
    });

    // Si la simulación es exitosa, se envía la transacción.
    const hash = await walletClient.writeContract(contractRequest);
    console.log(`✅ Acción de admin ejecutada: ${contractName}.${functionName}. Hash:`, hash);
    return NextResponse.json({ success: true, hash });
  } catch (error: any) {
    console.error(`❌ Error al ejecutar ${contractName}.${functionName}:`, error);
    // Devuelve un mensaje de error más genérico para no exponer detalles internos.
    return NextResponse.json({ error: "Error al procesar la transacción en la blockchain." }, { status: 500 });
  }
}
