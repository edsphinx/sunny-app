"use client";

import type { NextPage } from "next";
import { CommitmentCreator } from "~~/components/sunny/CommitmentCreator";
import { ExperienceNftAdmin } from "~~/components/sunny/ExperienceNftAdmin";
import { MatchManager } from "~~/components/sunny/MatchManager";
import { PresenceScoreChecker } from "~~/components/sunny/PresenceScoreChecker";

// Ya no necesitamos el hook de eventos aquí, porque cada componente lo maneja internamente.

const Home: NextPage = () => {
  // Ya no hay lógica de hooks aquí, la página es puramente visual.

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">Protocolo Sunny ☀️</span>
          </h1>
          <p className="text-center text-lg">Dashboard de Pruebas Interactivo</p>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ahora llamamos a los componentes sin pasarles ninguna prop */}
            <ExperienceNftAdmin />
            <MatchManager />
            <PresenceScoreChecker />
            <CommitmentCreator />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
