import {redirect} from "react-router";

export function loader() {
  return redirect("/login");
}

export default function Index() {
  return null;
}
