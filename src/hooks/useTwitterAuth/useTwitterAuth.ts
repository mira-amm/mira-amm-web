import {useMutation} from "@tanstack/react-query";
import useFirebase from "@/src/hooks/useFirebase/useFirebase";
import {getAuth, signInWithPopup, TwitterAuthProvider } from "firebase/auth";

const useTwitterAuth = () => {
  useFirebase();

  const mutationFn = async () => {
    const provider = new TwitterAuthProvider();
    const auth = getAuth();
    return signInWithPopup(auth, provider);
  };

  const { data, mutateAsync, reset } = useMutation({
    mutationFn,
  });

  return { data, mutateAsync, reset };
};

export default useTwitterAuth;
