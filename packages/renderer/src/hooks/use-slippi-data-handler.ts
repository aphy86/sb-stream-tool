// import { useFormContext } from "react-hook-form";
// import { Tournament } from "@app/common";
// import { usePlayerFormFieldArrayContext } from "./use-player-form-field-array-context";
// import { useEffect } from "react";
// import {
//   clearAllListeners,
//   onNewSlippiGameData,
//   onNewSlippiGameEndData,
//   send,
// } from "@app/preload";
// import {
//   changeSetFormat,
//   findSlippiWinner,
//   onSubmit,
// } from "@renderer/utils/helpers";
// import { useSettingsStore } from "@renderer/zustand/store";

// export function useSlippiDataHandler() {
//   const { setValue, getValues, handleSubmit } = useFormContext<Tournament>();
//   const teams = usePlayerFormFieldArrayContext();
//   const slippiRelayStatus = useSettingsStore(
//     (state) => state.slippiRelayStatus,
//   );
//   const slippiRelayAutoUpdate = useSettingsStore(
//     (state) => state.slippiRelayAutoupdate,
//   );

//   useEffect(() => {
//     const hasSetEnded = () => {
//       const bestOf = getValues("bestOf");
//       const scoreToBeat =
//         bestOf % 2 === 0 ? bestOf / 2 + 1 : Math.ceil(bestOf / 2);
//       for (let i = 0; i < getValues("teams").length; i++) {
//         if (getValues(`teams.${i}.score`) >= scoreToBeat) return true;
//       }
//       return false;
//     };

//     onNewSlippiGameData((data) => {
//       const setEnded = hasSetEnded();

//       if (setEnded || !data.isSameGame) {
//         if (data.isTeams) {
//           changeSetFormat("Doubles", teams);
//           setValue("setFormat", "Doubles");
//         } else {
//           changeSetFormat("Singles", teams);
//           setValue("setFormat", "Singles");
//         }

//         if (setEnded) {
//           for (let index = 0; index < getValues("teams").length; index++) {
//             setValue(`teams.${index}.score`, 0);
//           }
//         }

//         for (let i = 0; i < getValues("teams").length; i++) {
//           for (
//             let j = 0;
//             j <
//             Math.min(
//               getValues(`teams.${i}.players`).length,
//               data.players[i].length, // you can have 1 player on one team and 3 players on another, can't handle that right now in frontend, will do in a future update
//             );
//             j++
//           ) {
//             setValue(`teams.${i}.players.${j}.gameInfo`, {
//               character: data.players[i][j].character,
//               altCostume: data.players[i][j].color,
//               port: data.players[i][j].port,
//             });
//           }
//         }
//       }

//       send("obs/play-game-start-scenes").catch((error) => console.log(error));

//       if (slippiRelayStatus !== "disabled" && slippiRelayAutoUpdate) {
//         handleSubmit(onSubmit)().catch((error) => console.log(error));
//       }
//     });
//     return () => clearAllListeners("slippi:new-game-start-data");
//   }, [getValues, handleSubmit, setValue, slippiRelayStatus, teams]);

//   useEffect(() => {
//     onNewSlippiGameEndData((winner) => {
//       const winnerIndex = findSlippiWinner(winner.winners, getValues);
//       const bestOf = getValues("bestOf");
//       const scoreToBeat =
//         bestOf % 2 === 0 ? bestOf / 2 + 1 : Math.ceil(bestOf / 2);
//       if (winnerIndex !== undefined) {
//         const newScore = getValues(`teams.${winnerIndex}.score`) + 1;
//         setValue(`teams.${winnerIndex}.score`, newScore);

//         // Set officially ended, new set, else game officially ended, new game
//         if (newScore >= scoreToBeat) {
//           send("obs/play-set-end-scenes").catch((error) => console.log(error));
//         } else {
//           send("obs/play-game-end-scenes").catch((error) => console.log(error));
//         }

//         if (slippiRelayStatus !== "disabled" && slippiRelayAutoUpdate) {
//           handleSubmit(onSubmit)().catch((error) => console.log(error));
//         }
//       }
//     });
//     return () => clearAllListeners("slippi:new-game-end-data");
//   }, [getValues, handleSubmit, setValue, slippiRelayStatus]);
// }
