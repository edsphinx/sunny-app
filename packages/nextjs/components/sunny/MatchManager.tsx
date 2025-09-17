import { useState } from "react";
import { MatchLevel } from "./MatchLevel";
import type { TransactionReceipt } from "viem";
import { AddressInput } from "~~/components/scaffold-eth";
import { useBackendWrite } from "~~/hooks/sunny/useBackendWrite";
import { useSunnyHistory } from "~~/hooks/sunny/useSunnyHistory";

const formatAddress = (addr = ""): string => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export const MatchManager = () => {
  const [userA, setUserA] = useState("");
  const [userB, setUserB] = useState("");
  const [location, setLocation] = useState("Mercado del Puerto, Montevideo");
  const [selectedMatchId, setSelectedMatchId] = useState("");

  const { writeContractAsync: createMatch, isMining: isCreating } = useBackendWrite("ProofOfMatch");
  const { writeContractAsync: recordInteraction, isMining: isRecording } = useBackendWrite("MatchData");

  /**
   * @notice Carga el historial de eventos para los Matches creados.
   * @dev Usa el hook optimizado 'useSunnyHistory' que busca eventos desde el bloque de
   * despliegue del contrato para asegurar que se listen todos los eventos de forma eficiente.
   * @todo Para una aplicación en producción reemplazar este mecanismo por una solución de indexación dedicada como Ponder.
   */
  const {
    data: createdMatches,
    isLoading: isLoadingMatches,
    refetch: refetchMatches,
  } = useSunnyHistory({
    contractName: "ProofOfMatch",
    eventName: "MatchCreated",
  });

  const handleCreateMatch = async () => {
    if (!userA || !userB) {
      alert("Por favor, completa las direcciones de ambos usuarios.");
      return;
    }
    try {
      await createMatch(
        { functionName: "createMatch", args: [userA, userB, location] },
        {
          onBlockConfirmation: () => {
            console.log("🤝 Match creado y confirmado! Iniciando actualización...");

            setTimeout(() => {
              console.log("🔄 Ejecutando refetch para actualizar la lista de Matches...");
              refetchMatches();
            }, 2000); // 2 segundos de espera

            setUserA("");
            setUserB("");
          },
        },
      );
    } catch (e) {
      console.error("Error al crear el match:", e);
    }
  };

  const handleRecordInteraction = async () => {
    try {
      await recordInteraction(
        { functionName: "recordInteraction", args: [BigInt(selectedMatchId || 0)] },
        {
          onBlockConfirmation: (txnReceipt: TransactionReceipt) => {
            console.log("⚡️ Interacción registrada y confirmada!", txnReceipt.blockHash);
            // Aunque el nivel se actualiza solo, refrescar la lista es una buena práctica
            // por si en el futuro se añade más data que dependa de esto.
            refetchMatches();
          },
        },
      );
    } catch (e) {
      console.error("Error al registrar la interacción:", e);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">2. Backend: Gestionar Matches</h2>
        <div className="divider">Crear Match</div>
        <AddressInput value={userA} onChange={setUserA} placeholder="Dirección Usuario A" />
        <AddressInput value={userB} onChange={setUserB} placeholder="Dirección Usuario B" />
        <input
          type="text"
          className="input input-bordered mt-2"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
        <button className="btn btn-secondary mt-2" onClick={handleCreateMatch} disabled={isCreating}>
          {isCreating ? <span className="loading loading-spinner"></span> : "Crear Match"}
        </button>

        <div className="divider">Matches Creados</div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {isLoadingMatches && <span className="loading loading-spinner mx-auto"></span>}
          {/* Mapeamos los matches en orden inverso para mostrar el más reciente primero */}
          {[...(createdMatches || [])].reverse().map((match, index) => (
            <button
              key={index}
              className={`w-full text-left p-2 bg-base-200 rounded-lg hover:bg-base-300 border-2 ${
                selectedMatchId === match.args.matchId?.toString() ? "border-primary" : "border-transparent"
              }`}
              onClick={() => setSelectedMatchId(match.args.matchId?.toString() || "")}
            >
              <div className="flex justify-between items-center">
                <p className="text-sm font-mono flex items-center">
                  <b>Match ID:</b> {match.args.matchId?.toString()}
                </p>
                {/* Usamos el componente auxiliar para mostrar el nivel actualizado */}
                {match.args.matchId !== undefined && <MatchLevel matchId={match.args.matchId} />}
              </div>
              <p className="text-xs">
                <b>Participantes:</b> {formatAddress(match.args.userA)} & {formatAddress(match.args.userB)}
              </p>
            </button>
          ))}
        </div>

        <div className="divider">Registrar Interacción (Sube de Nivel)</div>
        <input
          type="text"
          placeholder="Haz clic en un match de la lista"
          className="input input-bordered"
          value={selectedMatchId}
          readOnly
        />
        <button
          className="btn btn-accent mt-2"
          onClick={handleRecordInteraction}
          disabled={isRecording || !selectedMatchId}
        >
          {isRecording ? <span className="loading loading-spinner"></span> : "Confirmar Interacción"}
        </button>
      </div>
    </div>
  );
};
