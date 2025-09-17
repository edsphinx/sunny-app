"use client";

import type { NextPage } from "next";
import { CommitmentManager } from "~~/components/sunny/CommitmentManager";
import { ContractInfo } from "~~/components/sunny/ContractInfo";
import { ExperienceNftAdmin } from "~~/components/sunny/ExperienceNftAdmin";
import { MatchManager } from "~~/components/sunny/MatchManager";
import { PresenceScoreChecker } from "~~/components/sunny/PresenceScoreChecker";

const Home: NextPage = () => {
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
            <ExperienceNftAdmin />
            <MatchManager />
            <PresenceScoreChecker />
            <CommitmentManager />
            <ContractInfo />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
