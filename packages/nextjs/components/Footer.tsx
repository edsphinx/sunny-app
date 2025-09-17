import React from "react";
import { hardhat } from "viem/chains";
import { HeartIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { Faucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Footer del sitio, actualizado para el proyecto Sunny.
 */
export const Footer = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div>
        <div className="fixed flex justify-between items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
          {/* Faucet se muestra solo en redes locales para facilitar las pruebas */}
          {isLocalNetwork && (
            <div className="flex-1">
              <Faucet />
            </div>
          )}
          <SwitchTheme className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : "ml-auto"}`} />
        </div>
      </div>
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-2 text-sm w-full">
            <div className="flex justify-center items-center gap-2">
              <p className="m-0 text-center">
                Creado con <HeartIcon className="inline-block h-4 w-4" /> para
              </p>
              <span className="font-bold">Ethereum Uruguay 2025</span>
            </div>
            <span>·</span>
            <div className="text-center">
              <a href="https://github.com/edsphinx/sunny-app" target="_blank" rel="noreferrer" className="link">
                Código Fuente
              </a>
            </div>
            <span>·</span>
            <div className="flex justify-center items-center gap-1">
              <p className="m-0 text-center">un proyecto de</p>
              <a href="https://github.com/edsphinx" target="_blank" rel="noreferrer" className="link font-semibold">
                edsphinx
              </a>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
};
