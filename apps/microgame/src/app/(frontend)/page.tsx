import { redirect } from "next/navigation";

export default async function Home() {
  const res = await fetch("http://localhost:8000/api/users/me", {
   cache: "no-store",
 });

 const data = await res.json();

  if (!data.user) {
  redirect("/docs");
 }

  return (
  redirect("/admin/login")
 );
}
