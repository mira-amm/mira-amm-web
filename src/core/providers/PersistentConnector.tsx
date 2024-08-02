import {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef} from "react";
import {useConnectUI, useDisconnect, useFuel, useIsConnected} from "@fuels/react";

type PersistentConnectorContextType = {
  connect: VoidFunction;
  disconnect: VoidFunction;
  connectPersistedConnector: VoidFunction;
};

export const PersistentConnectorContext = createContext<PersistentConnectorContextType | null>(null);

type Props = {
  children: ReactNode;
};

export const usePersistentConnector = () => {
  const context = useContext(PersistentConnectorContext);

  if (!context) {
    throw new Error('usePersistentConnector must be used within a PersistentConnectorProvider');
  }

  return context;
};

const PersistentConnectorProvider = ({ children }: Props) => {
  const persistentConnectorName = useRef<string | undefined>(undefined);
  const connectClicked = useRef<boolean>(false);
  const { fuel } = useFuel();
  const { disconnect } = useDisconnect();
  const { isConnected } = useIsConnected();
  const { connect } = useConnectUI();

  useEffect(() => {
    const currentConnector = localStorage.getItem('fuel-current-connector');
    if (currentConnector) {
      persistentConnectorName.current = currentConnector;
    }
  }, []);

  useEffect(() => {
    const handleConnectStatusChange = async () => {
      if (connectClicked.current && isConnected) {
        const currentConnector = fuel.currentConnector();
        persistentConnectorName.current = currentConnector?.name;
        connectClicked.current = false;
      }
    };

    handleConnectStatusChange();
  }, [isConnected]);

  const connectPersistedConnector = useCallback(async () => {
    if (persistentConnectorName.current) {
      await fuel.selectConnector(persistentConnectorName.current);
    }
  }, [fuel]);

  const persistentConnect = useCallback(async () => {
    connect();
    connectClicked.current = true;
  }, [connect]);

  const persistentDisconnect = useCallback(() => {
    persistentConnectorName.current = undefined;
    disconnect();
  }, [disconnect]);

  const contextValue = useMemo(() => ({
    connect: persistentConnect,
    disconnect: persistentDisconnect,
    connectPersistedConnector,
  }), [persistentConnect, persistentDisconnect, connectPersistedConnector]);

  return (
    <PersistentConnectorContext.Provider value={contextValue}>
      {children}
    </PersistentConnectorContext.Provider>
  );
};

export default PersistentConnectorProvider;
