import { Inter } from "next/font/google"
import styles from "./not-found.module.css"

const inter = Inter({ subsets: ["latin"] })

export default function NotFound() {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className={styles.container}>
          <div>
            <h1 className={styles.code}>
              404
            </h1>
            <div className={styles.hr}>
              <h2 className={styles.message}>
                This page could not be found.
              </h2>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
