import Scenes from "./Scenes";
import WebsocketInputs from "./WebsocketInputs";

function Obs() {
  return (
    <div>
      <WebsocketInputs />
      <div className="py-2"></div>
      <Scenes />
    </div>
  );
}

export default Obs;
