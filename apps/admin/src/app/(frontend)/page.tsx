import { redirect } from "next/navigation";

export default async function Home() {
  /* const url = process.env.NODE_ENV === 'development'
*   ? `${process.env.ADMIN_LOCAL_URL}/api/users/me`
*   : `${process.env.ADMIN_PUBLIC_URL}/api/users/me`;

* const res = await fetch(url, { cache: "no-store" });

 const data = await res.json();

* if (!data.user) {
* redirect("/docs");
 } */

  return (
  redirect("/docs")
  /* redirect("/admin/login") */
 );
}
