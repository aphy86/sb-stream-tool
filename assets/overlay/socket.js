const socket = io("http://127.0.0.1:20242/");

const portToNum = {
  Red: 0,
  Blue: 1,
  Green: 2,
  Yellow: 3,
};

const portToImg = {
  Red: "ports/port1.svg",
  Blue: "ports/port2.svg",
  Green: "ports/port3.svg",
  Yellow: "ports/port4.svg",
};
const NAME_MAX_SIZE = 40; // px, matches .playername in overlay.css
const NAME_MIN_SIZE = 16; // px, don't shrink past this
const NAME_STEP = 1; // px per iteration

function fit(el) {
  el.style.fontSize = `${NAME_MAX_SIZE}px`; // reset before measuring

  let size = NAME_MAX_SIZE;
  while (
    size > NAME_MIN_SIZE &&
    (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)
  ) {
    size -= NAME_STEP;
    el.style.fontSize = `${size}px`;
  }
}

function setElementData(id, data) {
  if (
    document.getElementById(id) === null ||
    data === undefined ||
    data === null
  ) {
    return;
  }

  const el = (document.getElementById(id).innerText = data);
  fit(el);
}

function getPlayerNames(players, inLosers) {
  const nameList = [];

  for (let i = 0; i < players.length; i++) {
    if (players[i].playerInfo.playerTag !== "") {
      nameList.push(players[i].playerInfo.playerTag);
    }
  }

  if (nameList.length <= 0) {
    return "";
  }

  names = "";
  names = nameList.join(" / ");
  if (inLosers) {
    names += " [L]";
  }

  return names;
}

function getPort(nodes, players) {
  for (let j = 0; j < nodes.length; j++) {
    nodes[j].src = "./ports/noport.svg";
  }
  for (let i = 0; i < players.length; i++) {
    nodes[portToNum[players[i].gameInfo.port]].src =
      portToImg[players[i].gameInfo.port];
  }
}

function getPronouns(players) {
  const pronounsList = [];
  for (let i = 0; i < players.length; i++) {
    if (players[i].playerInfo.pronouns !== "") {
      pronounsList.push(players[i].playerInfo.pronouns);
    }
  }

  if (pronounsList.length <= 0) {
    return "";
  }

  return pronounsList.join("/");
}

function getCharacters(nodes, players) {
  for (let j = 0; j < nodes.length; j++) {
    nodes[j].style.width = "0px";
    nodes[j].style.height = "0px";
    nodes[j].src = "";
  }
  for (let i = 0; i < players.length; i++) {
    nodes[i].style.width = "30px";
    nodes[i].style.height = "30px";
    if (players[i].gameInfo.character == "Random") {
      nodes[i].src = "../characters/melee/random/icons/overlay-default.png";
    } else {
      nodes[i].src = `../characters/melee/${players[
        i
      ].gameInfo.character.toLowerCase()}/icons/${players[
        i
      ].gameInfo.altCostume.toLowerCase()}.png`;
    }
  }
}

function getTeams(team) {
  const teamList = [];
  for (let i = 0; i < team.players.length; i++) {
    if (team.players[i].playerInfo.teamName !== "") {
      teamList.push(team.players[i].playerInfo.teamName);
    }
  }

  if (teamList.length <= 0) {
    return "";
  }

  return teamList.join(" / ");
}

function getRoundFormat(roundFormat, customRoundFormat, roundNumber) {
  if (customRoundFormat) return customRoundFormat;

  return `${roundFormat} ${roundNumber ? roundNumber : ""}`;
}

function updateOverlay(newData) {
  console.log("updating overlay");
  console.log(newData);
  setElementData(
    "left-playername",
    getPlayerNames(newData.teams[0].players, newData.teams[0].inLosers),
  );

  setElementData(
    "right-playername",
    getPlayerNames(newData.teams[1].players, newData.teams[1].inLosers),
  );

  setElementData("left-score", newData.teams[0].score);
  setElementData("right-score", newData.teams[1].score);

  setElementData("tournament-name", newData.name);
  setElementData("best-of", newData.bestOf);

  setElementData(
    "round-format",
    getRoundFormat(
      newData.roundFormat,
      newData.customRoundFormat,
      newData.roundNumber,
    ),
  );
  setElementData("left-team", getTeams(newData.teams[0]));
  setElementData("right-team", getTeams(newData.teams[1]));
  setElementData("set-format", newData.setFormat);

  getPort(
    document.getElementById("left-port").getElementsByTagName("img"),
    newData.teams[0].players,
  );
  getPort(
    document.getElementById("right-port").getElementsByTagName("img"),
    newData.teams[1].players,
  );
  document.getElementById("left-pronouns").innerText = getPronouns(
    newData.teams[0].players,
  );
  document.getElementById("right-pronouns").innerText = getPronouns(
    newData.teams[1].players,
  );
  getCharacters(
    document.getElementById("left-character").getElementsByTagName("img"),
    newData.teams[0].players,
  );
  getCharacters(
    document.getElementById("right-character").getElementsByTagName("img"),
    newData.teams[1].players,
  );
}

socket.on("sendDataToClients", (newData) => {
  updateOverlay(newData);
  socket.broadcast.emit("overlayUpdateSuccess");
});
