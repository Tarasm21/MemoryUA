
import MemorialPageClient from "./MemorialPageClient";

type MemorialPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MemorialPage({
  params,
}: MemorialPageProps) {
  const { id } = await params;

  return <MemorialPageClient id={id} />;
}
