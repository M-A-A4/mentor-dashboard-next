
import "./globals.css";

export const metadata = {
  title: "Mentor Dashboard",
  description: "Project and task management dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
