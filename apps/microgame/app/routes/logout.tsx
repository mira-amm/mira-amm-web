import {redirect} from "react-router";

export function loader() {
  return redirect("/logout");
}

export default function Logout() {
  return null;
}
