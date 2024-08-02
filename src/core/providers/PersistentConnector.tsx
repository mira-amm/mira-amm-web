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
    // const handleInitialConnect = async () => {
    //   console.log('Initial connect to wallet')
    //   const connectStatus = await fuel.connect();
    //   if (connectStatus) {
    //     console.log('[i]Connected to wallet');
    //     const currentConnector = fuel.currentConnector();
    //     console.log('[i]Persisting new connector:', currentConnector?.name);
    //     persistentConnectorName.current = currentConnector?.name;
    //   }
    // };

    // console.log('Initializing persistent connector');
    // if (isConnected) {
      const currentConnector = fuel.currentConnector();
      console.log('Persisting initial connector:', currentConnector?.name);
      persistentConnectorName.current = currentConnector?.name;
    // }

    // handleInitialConnect();
  }, []);

  useEffect(() => {
    const handleConnectStatusChange = async () => {
      console.log('[c]Connect status changed:', isConnected);
      if (connectClicked.current && isConnected) {
        console.log('[c]Connected to wallet');
        const currentConnector = fuel.currentConnector();
        console.log('[c]Persisting new connector:', currentConnector?.name);
        persistentConnectorName.current = currentConnector?.name;
        connectClicked.current = false;
      }
    };

    handleConnectStatusChange();
  }, [isConnected]);

  const connectPersistedConnector = useCallback(async () => {
    console.log('Trying to reconnect to persisted connector:', persistentConnectorName.current);
    if (persistentConnectorName.current) {
      console.log('Reconnecting to persisted connector:', persistentConnectorName.current);
      await fuel.selectConnector(persistentConnectorName.current);
    }
  }, [fuel]);

  const persistentConnect = useCallback(async () => {
    console.log('Connect clicked');
    connect();
    connectClicked.current = true;
  }, []);

  const persistentDisconnect = useCallback(() => {
    console.log('Disconnect, previous was', persistentConnectorName.current, 'reset previous');
    persistentConnectorName.current = undefined;
    disconnect();
  }, [disconnect]);

  const contextValue = useMemo(() => ({
    connect: persistentConnect,
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
