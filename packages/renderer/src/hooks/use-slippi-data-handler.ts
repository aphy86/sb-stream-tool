import { useEffect } from "react";
import {
  clearAllListeners,
  onNewSlippiGameData,
  onNewSlippiGameEndData,
  send,
} from "@app/preload";
import { useSettingsStore } from "@renderer/zustand/store";
import {
  MatchDefaultValues,
  useTypedAppFormContext,
} from "@renderer/utils/form";
import { formOptions } from "@tanstack/react-form";
import { MatchSchema } from "@renderer/types/MatchSchema";
import { findSlippiWinner } from "@renderer/utils/helpers";

export function useSlippiDataHandler() {
  const form = useTypedAppFormContext({
    ...formOptions,
    defaultValues: MatchDefaultValues,
    onSubmit: async ({ value }) => {
      console.log(value);
      // onSubmit(value);
    },
    validators: {
      onChange: MatchSchema,
    },
  });
  const slippiRelayStatus = useSettingsStore(
    (state) => state.slippiRelayStatus,
  );
  const slippiRelayAutoUpdate = useSettingsStore(
    (state) => state.slippiRelayAutoupdate,
  );

  useEffect(() => {
    const hasSetEnded = () => {
      const bestOf = form.getFieldValue("bestOf");
      const scoreToBeat =
        bestOf % 2 === 0 ? bestOf / 2 + 1 : Math.ceil(bestOf / 2);
      for (let i = 0; i < form.getFieldValue("teams").length; i++) {
        if (form.getFieldValue(`teams[${i}].score`) >= scoreToBeat) return true;
      }
      return false;
    };

    onNewSlippiGameData((data) => {
      const setEnded = hasSetEnded();

      if (setEnded || !data.isSameGame) {
        if (data.isTeams) {
          form.setFieldValue("setFormat", "Doubles");
        } else {
          form.setFieldValue("setFormat", "Singles");
        }

        if (setEnded) {
          for (
            let index = 0;
            index < form.getFieldValue("teams").length;
            index++
          ) {
            form.setFieldValue(`teams[${index}].score`, 0);
          }
        }

        for (let i = 0; i < form.getFieldValue("teams").length; i++) {
          for (
            let j = 0;
            j <
            Math.min(
              form.getFieldValue(`teams[${i}].players`).length,
              data.players[i].length, // you can have 1 player on one team and 3 players on another, can't handle that right now in frontend, will do in a future update
            );
            j++
          ) {
            form.setFieldValue(`teams[${i}].players[${j}].gameInfo`, {
              character: data.players[i][j].character,
              altCostume: data.players[i][j].color,
              port: data.players[i][j].port,
            });
          }
        }
      }

      send("obs/play-game-start-scenes").catch((error) => console.log(error));

      if (slippiRelayStatus !== "disabled" && slippiRelayAutoUpdate) {
        form.handleSubmit();
      }
    });
    return () => clearAllListeners("slippi:new-game-start-data");
  }, [slippiRelayStatus]);

  useEffect(() => {
    onNewSlippiGameEndData((winner) => {
      const winnerIndex = findSlippiWinner(
        winner.winners,
        form.getFieldValue("teams"),
      );
      const bestOf = form.getFieldValue("bestOf");
      const scoreToBeat =
        bestOf % 2 === 0 ? bestOf / 2 + 1 : Math.ceil(bestOf / 2);
      if (winnerIndex !== undefined) {
        const newScore = form.getFieldValue(`teams[${winnerIndex}].score`) + 1;
        form.setFieldValue(`teams[${winnerIndex}].score`, newScore);

        // Set officially ended, new set, else game officially ended, new game
        if (newScore >= scoreToBeat) {
          send("obs/play-set-end-scenes").catch((error) => console.log(error));
        } else {
          send("obs/play-game-end-scenes").catch((error) => console.log(error));
        }

        if (slippiRelayStatus !== "disabled" && slippiRelayAutoUpdate) {
          form.handleSubmit();
        }
      }
    });
    return () => clearAllListeners("slippi:new-game-end-data");
  }, [slippiRelayStatus]);
}
