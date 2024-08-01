import {useConnect, useFuel, useIsConnected} from "@fuels/react";
import {useEffect, useRef} from "react";

const usePersistentConnector = () => {
  const { fuel } = useFuel();
  const currentConnector = fuel.currentConnector();
  const { isConnected } = useIsConnected();
  const previousConnectorName = useRef<string | undefined>(currentConnector?.name);
  const { connect } = useConnect();

  useEffect(() => {
    fuel.on(fuel.events.connectors, console.log);
  }, []);

  useEffect(() => {
    if (isConnected && currentConnector?.name) {
      if (!previousConnectorName.current) {
        console.log('No previous, write new connector:', currentConnector.name);
        previousConnectorName.current = currentConnector.name;
      } else if (previousConnectorName.current && currentConnector.name !== previousConnectorName.current) {
        console.log('Previous !== new', previousConnectorName.current, currentConnector.name, 'connect previous');
        fuel.selectConnector(previousConnectorName.current).then();
        // connect(previousConnectorName.current);
      }
    }
  }, [currentConnector?.name]);

  useEffect(() => {
    if (!isConnected) {
      console.log('Disconnect, previous was', previousConnectorName.current, 'reset previous');
      previousConnectorName.current = undefined;
    }
  }, [isConnected]);
};

export default usePersistentConnector;
