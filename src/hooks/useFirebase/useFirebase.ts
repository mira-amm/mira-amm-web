import {initializeApp} from "firebase/app";
import {useMemo} from "react";

const firebaseConfig = {
  apiKey: "AIzaSyAMLHNeN70t5eRkTMeNxBwQ--6NzlI_etU",
  authDomain: "fuelet-app.firebaseapp.com",
  projectId: "fuelet-app",
  storageBucket: "fuelet-app.appspot.com",
  messagingSenderId: "325798141098",
  appId: "1:325798141098:web:276ddacdc8d91008a844d3"
};

const useFirebase = () => {
  return useMemo(() => initializeApp(firebaseConfig), []);
};

export default useFirebase;
