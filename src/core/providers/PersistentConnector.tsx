import {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef} from "react";
import {useDisconnect, useFuel, useIsConnected} from "@fuels/react";

type PersistentConnectorContextType = {
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
  const { fuel } = useFuel();
  const { disconnect } = useDisconnect();
  const { isConnected } = useIsConnected();

  useEffect(() => {
    const handleInitialConnect = async () => {
      console.log('Initial connect to wallet')
      const connectStatus = await fuel.connect();
      if (connectStatus) {
        console.log('[i]Connected to wallet');
        const currentConnector = fuel.currentConnector();
        console.log('[i]Persisting new connector:', currentConnector?.name);
        persistentConnectorName.current = currentConnector?.name;
      }
    };

    handleInitialConnect();
  }, []);

  useEffect(() => {
    const handleConnectStatusChange = async () => {
      console.log('[c]Connect status changed:', isConnected);
      if (isConnected) {
        console.log('[c]Connected to wallet');
        const currentConnector = fuel.currentConnector();
        console.log('[c]Persisting new connector:', currentConnector?.name);
        persistentConnectorName.current = currentConnector?.name;
      }
    };

    handleConnectStatusChange();
  }, [isConnected]);

  const connectPersistedConnector = useCallback(async () => {
    if (persistentConnectorName.current) {
      console.log('Reconnecting to persisted connector:', persistentConnectorName.current);
      await fuel.selectConnector(persistentConnectorName.current);
    }
  }, [fuel]);

  const persistentDisconnect = useCallback(() => {
    console.log('Disconnect, previous was', persistentConnectorName.current, 'reset previous');
    persistentConnectorName.current = undefined;
    disconnect();
  }, [disconnect]);

  const contextValue = useMemo(() => ({
    disconnect: persistentDisconnect,
    connectPersistedConnector,
  }), [persistentDisconnect, connectPersistedConnector]);

  return (
    <PersistentConnectorContext.Provider value={contextValue}>
      {children}
    </PersistentConnectorContext.Provider>
  );
};

export default PersistentConnectorProvider;
