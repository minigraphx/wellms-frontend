import { Nav } from "../components/Nav";

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
