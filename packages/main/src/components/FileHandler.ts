import path from "node:path";
import { EventStream } from "./EventStream.js";
import { app } from "electron";
import { mkdir } from "node:fs/promises";
import { Match } from "@app/common";
import fs, { outputFile } from "fs-extra";
import { isPlainObject } from "es-toolkit";

const getRootPath = () => {
  let rootPath = app.getAppPath();
  if (process.env.NODE_ENV !== "development" && process.platform == "win32") {
    rootPath = process.env.PORTABLE_EXECUTABLE_DIR ?? "undefined";
  }
  return rootPath;
};

const getConfigRootPath = (rootPath: string) => {
  let configRootPath = path.join(rootPath, "..", "config");
  if (process.env.NODE_ENV !== "development" && process.platform == "win32") {
    configRootPath = path.join(rootPath, "config");
  }
  return configRootPath;
};

const getResourcesRootPath = (rootPath: string) => {
  let resourcesRootPath = path.join(rootPath, "..", "resources");
  if (process.env.NODE_ENV !== "development" && process.platform == "win32") {
    resourcesRootPath = path.join(rootPath, "resources");
  }
  return resourcesRootPath;
};

const getOverlayRootPath = (rootPath: string) => {
  let overlayRootPath = path.join(rootPath, "assets", "overlay");
  if (process.env.NODE_ENV !== "development") {
    overlayRootPath = path.join(process.resourcesPath, "overlay");
  }
  return overlayRootPath;
};

const getCharactersRootPath = (rootPath: string) => {
  let charactersRootPath = path.join(rootPath, "assets", "characters");
  if (process.env.NODE_ENV !== "development") {
    charactersRootPath = path.join(process.resourcesPath, "characters");
  }
  return charactersRootPath;
};
// make this less cluttered right now
export class FileHandler {
  private static rootPath: string = getRootPath();
  private static configRootPath: string = getConfigRootPath(this.rootPath);
  private static resourcesRootPath: string = getResourcesRootPath(
    this.rootPath,
  );
  private static overlayRootPath: string = getOverlayRootPath(this.rootPath);
  private static charactersRootPath: string = getCharactersRootPath(
    this.rootPath,
  );
  // constructor() {
  //   super();
  //   this.rootPath = app.getAppPath();
  //   this.resourcesRootPath = path.join(this.rootPath, "..", "resources");
  //   this.configRootPath = path.join(this.rootPath, "..", "config");
  //   this.overlayRootPath = `${this.rootPath}/assets/overlay/`;
  //   this.charactersRootPath = `${this.rootPath}/assets/characters/`;
  //   if (process.env.NODE_ENV !== "development") {
  //     this.overlayRootPath = `${process.resourcesPath}/overlay/`;
  //     this.charactersRootPath = `${process.resourcesPath}/characters/`;
  //     if (process.platform == "win32") {
  //       this.rootPath = process.env.PORTABLE_EXECUTABLE_DIR ?? "undefined";
  //       this.resourcesRootPath = path.join(this.rootPath, "resources");
  //       this.configRootPath = path.join(this.rootPath, "config");
  //     }
  //   }
  // }

  private static async serialize(data: any) {
    if (data === null || data === undefined) {
      return "";
    } else if (Array.isArray(data) || isPlainObject(data)) {
      return JSON.stringify(data);
    } else if (Buffer.isBuffer(data)) {
      return data;
    } else {
      return String(data);
    }
  }

  private static async write(location: string, data: any) {
    const serializedData = await this.serialize(data);
    return outputFile(location, serializedData)
      .then(() => undefined)
      .catch((error: Error) => error);
  }

  // writes data to text files
  static async writeData(data: Match) {
    const dataPath = path.join(this.resourcesRootPath, "texts");
    const errors = [] as Error[];

    const setPotentialErrors = await Promise.all([
      this.write(`${dataPath}/tournament-name.txt`, data.tournamentName),
      this.write(`${dataPath}/best-of.txt`, data.bestOf.toString()),
      this.write(`${dataPath}/round-format.txt`, data.roundFormat),
      this.write(`${dataPath}/custom-round-format.txt`, data.customRoundFormat),
      this.write(`${dataPath}/round-number.txt`, data.roundNumber),
    ]);
    errors.push(...setPotentialErrors.filter((e) => e !== undefined));

    for (let i = 0; i < data.commentators.length; i++) {
      const commentatorsRootPath = `${dataPath}/commentators/${i + 1}`;
      const commentatorsPotentialErrors = await Promise.all([
        this.write(
          `${commentatorsRootPath}/name.txt`,
          data.commentators[i].name,
        ),
        this.write(
          `${commentatorsRootPath}/twitter.txt`,
          data.commentators[i].socials,
        ),
        this.write(
          `${commentatorsRootPath}/pronouns.txt`,
          data.commentators[i].pronouns,
        ),
      ]);
      errors.push(
        ...commentatorsPotentialErrors.filter((e) => e !== undefined),
      );
    }

    for (let i = 0; i < data.teams.length; i++) {
      for (let j = 0; j < data.teams[i].players.length; j++) {
        const playerRootPath = `${dataPath}/teams/${i + 1}/players/${j + 1}`;
        const playerPotentialErrors = await Promise.all([
          this.write(
            `${playerRootPath}/team-name.txt`,
            data.teams[i].players[j].playerInfo.teamName,
          ),
          this.write(
            `${playerRootPath}/player-tag.txt`,
            data.teams[i].players[j].playerInfo.playerTag,
          ),
          this.write(
            `${playerRootPath}/pronouns.txt`,
            data.teams[i].players[j].playerInfo.pronouns,
          ),
          this.write(
            `${playerRootPath}/twitter.txt`,
            data.teams[i].players[j].playerInfo.socials,
          ),
          this.write(
            `${playerRootPath}/character.txt`,
            data.teams[i].players[j].gameInfo.character,
          ),
          this.write(
            `${playerRootPath}/alt-costume.txt`,
            data.teams[i].players[j].gameInfo.altCostume,
          ),
        ]);
        errors.push(...playerPotentialErrors.filter((e) => e !== undefined));
      }

      const teamRootPath = `${dataPath}/teams/${i + 1}`;
      const teamPotentialErrors = await Promise.all([
        this.write(`${teamRootPath}/name.txt`, data.teams[i].name),
        this.write(`${teamRootPath}/score.txt`, data.teams[i].score),
        this.write(
          `${teamRootPath}/in-losers.txt`,
          data.teams[i].inLosers ? "[L]" : "",
        ),
      ]);
      errors.push(...teamPotentialErrors.filter((e) => e !== undefined));
    }

    if (errors.length > 0) {
      for (const error of errors) {
        EventStream.notify("toast", error.message);
      }
      EventStream.notify("toast", `${errors.length} errors found`);
    } else {
      EventStream.notify("toast", "Data successfully saved to files!");
    }
  }

  static async createDirs() {
    // console.log(path.join(this.resourcesRootPath, "overlay"));
    fs.copy(
      this.overlayRootPath,
      `${path.join(this.resourcesRootPath, "overlay")}`,
      {
        recursive: true,
        overwrite: false,
      },
    );
    fs.copy(
      this.charactersRootPath,
      `${path.join(this.resourcesRootPath, "characters")}`,
      {
        recursive: true,
        overwrite: false,
      },
    );
    mkdir(`${path.join(this.resourcesRootPath, "texts", "commentators")}`, {
      recursive: true,
    });
    mkdir(`${path.join(this.resourcesRootPath, "texts", "teams")}`, {
      recursive: true,
    });
    mkdir(this.configRootPath, { recursive: true });
  }
}
