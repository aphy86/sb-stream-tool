import { app } from "electron";
import {
  accessSync,
  constants,
  copy,
  ensureDir,
  ensureDirSync,
  outputFile,
  remove,
  rmdir,
} from "fs-extra";
import path from "node:path";
import { EventStream } from "./EventStream.js";
import { Match, SocialMediaAccount } from "@app/common";
import { readdir } from "node:fs/promises";
import { Mutex } from "es-toolkit";

const isDev = process.env.NODE_ENV === "development";

function getAppDir() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return process.env.PORTABLE_EXECUTABLE_DIR;
  }
  if (process.env.APPIMAGE) {
    return path.dirname(process.env.APPIMAGE);
  }
  return path.dirname(app.getPath("exe"));
}

function getRootPath() {
  if (isDev) {
    return path.join(app.getAppPath(), "..", "resources");
  }
  const pathRoot = path.join(getAppDir(), "resources");
  try {
    ensureDirSync(pathRoot);
    accessSync(pathRoot, constants.W_OK);
  } catch {
    // fallback path in case the filepath where the tool resides can't be writable
    return path.join(app.getPath("documents"), "sb-stream-tool");
  }
  // ensured directory exists and can be written
  return pathRoot;
}

function getBundledAssetsRoot() {
  return isDev ? path.join(app.getAppPath(), "assets") : process.resourcesPath;
}

export class FileHandler {
  private static rootPath = getRootPath();
  private static textsRootPath = path.join(this.rootPath, "texts");
  private static writeMutex = new Mutex();

  static async createDirs() {
    const assets = getBundledAssetsRoot();

    try {
      await Promise.all([
        copy(
          path.join(assets, "overlay"),
          path.join(this.rootPath, "overlay"),
          { overwrite: false },
        ),
        copy(
          path.join(assets, "characters"),
          path.join(this.rootPath, "characters"),
          { overwrite: false },
        ),
        ensureDir(this.textsRootPath),
      ]);
    } catch (err) {
      console.error(err);
      EventStream.notify(
        "toast",
        "Output folders couldn't be created",
        String(err),
      );
    }
  }

  private static async removeExtraFiles(
    rootPath: string,
    filesToKeep: Map<string, string>,
  ) {
    const entries = await readdir(rootPath, {
      recursive: true,
      withFileTypes: true,
    }).catch((error) => {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    });

    const relative = (e: (typeof entries)[number]) =>
      path
        .relative(this.textsRootPath, path.join(e.parentPath, e.name))
        .split(path.sep)
        .join("/")
        .normalize();

    await Promise.all(
      entries
        .filter((e) => e.isFile() && !filesToKeep.has(relative(e)))
        .map((e) => remove(path.join(e.parentPath, e.name))),
    );

    // removes the subfolders if the file removals resulted in the folder being empty
    const dirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => path.join(e.parentPath, e.name))
      .sort((a, b) => b.length - a.length);
    for (const dir of dirs) {
      if ((await readdir(dir)).length === 0) await rmdir(dir);
    }
  }

  private static getSocialFileName(platform: string) {
    const windowsReserved = /^(con|prn|aux|nul|com\d|lpt\d)$/i;

    const formattedPlatform = platform
      .normalize("NFC")
      .toLowerCase()
      .replace(/[\uFE00-\uFE0F\u20E3]/g, "")
      .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
      .replace(/^-+|-+$/g, "");

    return windowsReserved.test(formattedPlatform)
      ? `${formattedPlatform}-`
      : formattedPlatform;
  }

  private static addSocials(
    files: Map<string, string>,
    dir: string,
    socials: SocialMediaAccount[],
  ) {
    for (const account of socials) {
      const formattedPlatform = this.getSocialFileName(account.platform);
      if (formattedPlatform) {
        files.set(`${dir}/socials/${formattedPlatform}.txt`, account.username);
      }
    }
  }

  private static async writeFiles(data: Match) {
    const files = new Map<string, string>([
      ["tournament-name.txt", data.tournamentName],
      ["best-of.txt", String(data.bestOf)],
      ["round-format.txt", data.roundFormat],
      ["custom-round-format.txt", data.customRoundFormat],
      ["round-number.txt", data.roundNumber ?? ""],
    ]);

    data.commentators.forEach((commentator, i) => {
      const dir = `commentators/${i + 1}`;
      files.set(`${dir}/name.txt`, commentator.name);
      files.set(`${dir}/pronouns.txt`, commentator.pronouns);
      this.addSocials(files, dir, commentator.socials);
    });

    data.teams.forEach((team, i) => {
      const teamDir = `teams/${i + 1}`;
      files.set(`${teamDir}/name.txt`, team.name);
      files.set(`${teamDir}/score.txt`, String(team.score));
      files.set(`${teamDir}/in-losers.txt`, team.inLosers ? "[L]" : "");
      team.players.forEach(({ playerInfo, gameInfo }, j) => {
        const dir = `${teamDir}/players/${j + 1}`;
        files.set(`${dir}/team-name.txt`, playerInfo.teamName);
        files.set(`${dir}/player-tag.txt`, playerInfo.playerTag);
        files.set(`${dir}/pronouns.txt`, playerInfo.pronouns);
        files.set(`${dir}/character.txt`, gameInfo.character);
        files.set(`${dir}/alt-costume.txt`, gameInfo.altCostume);
        this.addSocials(files, dir, playerInfo.socials);
      });
    });

    const results = await Promise.allSettled(
      [...files].map(([filePath, fileData]) =>
        outputFile(path.join(this.textsRootPath, filePath), fileData),
      ),
    );
    const errors = results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );

    try {
      await Promise.all(
        ["commentators", "teams"].map((dir) =>
          this.removeExtraFiles(path.join(this.textsRootPath, dir), files),
        ),
      );
    } catch (err) {
      errors.push(err);
    }

    if (errors.length > 0) {
      console.error(errors);
      EventStream.notify(
        "toast",
        "Couldn't save files",
        `${errors.length} failed`,
      );
    } else {
      EventStream.notify("toast", "Data successfully saved to files!");
    }
  }

  static async writeData(data: Match) {
    await this.writeMutex.acquire();
    try {
      await this.writeFiles(data);
    } finally {
      this.writeMutex.release();
    }
  }
}
