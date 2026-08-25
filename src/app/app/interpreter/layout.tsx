import { InterpreterShell } from "@/components/layout/InterpreterShell";

export default function InterpreterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <InterpreterShell>{children}</InterpreterShell>;
}
